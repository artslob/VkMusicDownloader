import argparse
import asyncio
import datetime
import itertools
import logging
import os
import sys
import time
from argparse import FileType, ArgumentTypeError
from logging import FileHandler
from os.path import join

import aiofiles
import aiohttp
import pathvalidate

logger: logging.Logger

LogLevels = {
    0: logging.WARNING,
    1: logging.INFO,
    2: logging.DEBUG,
}


def get_parser():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parser = argparse.ArgumentParser(description='Download audios from text file with links.')
    parser.add_argument('-d', '--dir', dest='dir', type=writable_dir, default=current_dir,
                        help='Destination directory where audios are saved. Default: %(default)s.')
    parser.add_argument('-f', '--file', dest='file', type=FileType(), default=join(current_dir, 'audios.txt'),
                        help="File that contains names of songs and their urls. Can be set to stdin with value '-'. "
                             "Default: %(default)s.")
    parser.add_argument('-n', '--number', dest='number', type=positive_int, default=10,
                        help='Number of files that downloading at the same time. Default: %(default)s.')
    parser.add_argument('-l', '--logfile', dest='logfile', type=FileType('w'), default='-',
                        help="Writable file for logging. By default set to stdout with value '%(default)s'.")
    parser.add_argument('-v', '--verbose', dest='verbose', default=0, action='count',
                        help='Set level of logging. You can increase level by repeating key. Levels by number: ' +
                             ', '.join(f'{"-" + "v" * number if number else "default"}: {logging._levelToName[level]}'
                                       for number, level in LogLevels.items()))
    return parser


def writable_dir(directory):
    if not os.path.isdir(directory):
        raise argparse.ArgumentTypeError(f'not a directory: {directory!r}')
    if os.access(directory, os.W_OK):
        directory = os.path.expanduser(directory)
        return os.path.abspath(directory)
    else:
        raise argparse.ArgumentTypeError(f'directory is not writable: {directory!r}')


def positive_int(arg):
    try:
        arg = int(arg)
    except (ValueError, TypeError):
        raise ArgumentTypeError(f'not integer value: {arg!r}')
    if arg > 0:
        return arg
    else:
        raise ArgumentTypeError('value should be positive')


def get_logger(args, program_name):
    logging_params = {
        'format': '[%(asctime)s] [%(levelname)s] %(message)s',
        'datefmt': '%H:%M:%S',
    }

    if args.logfile is not sys.stdout:
        logging_params['handlers'] = [FileHandler(args.logfile.name, encoding='utf8'), ]

    most_verbose_key = sorted(LogLevels.keys())[-1]
    logging_params['level'] = LogLevels.get(args.verbose, LogLevels[most_verbose_key])

    logging.basicConfig(**logging_params)

    return logging.getLogger(program_name)


def opening_log(args):
    logger.info('Program started')
    for param, value in args._get_args():
        logger.debug(f'{param}: {value}')
    for param, value in args._get_kwargs():
        logger.debug(f'{param}: {value}')
    logger.debug('Current level of logging: %s', logging.getLevelName(logger.getEffectiveLevel()))


async def download(song_no, directory, name, url, *, chunk_size=1 << 15):
    log_entry = f'[{song_no:03}]: "{name}"'
    try:
        async with aiohttp.request('GET', url) as response:  # type: aiohttp.ClientResponse
            response.raise_for_status()
            logging.info(f'Downloading {log_entry}')
            filename = os.path.join(directory, name)
            async with aiofiles.open(filename, 'wb') as file:
                while True:
                    chunk = await response.content.read(chunk_size)
                    if not chunk:
                        break
                    await file.write(chunk)
            logging.info(f'Done {log_entry}')
            return await response.release()
    except (aiohttp.client_exceptions.ClientError, OSError) as e:
        logging.error(f"Song not completed: {log_entry} with error '{e}'")


def get_songs(file):
    failed_sanitize_counter = 1
    for song_no, line in enumerate(file.readlines(), 1):
        name, url = (el.strip() for el in line.split('\t'))
        try:
            new_name = pathvalidate.sanitize_filename(name)
        except pathvalidate.error.ValidationError as e:
            logger.error(f'Could not sanitize name "{name}": {e}')
            new_name = f'unknown-name-({failed_sanitize_counter})'
            failed_sanitize_counter += 1
        else:
            if name != new_name:
                logger.info(f'Song name "{name}" sanitized to "{new_name}"')
        yield song_no, f'{new_name}.mp3', url


def main():
    global logger

    parser = get_parser()
    args = parser.parse_args()
    logger = get_logger(args, parser.prog)
    opening_log(args)
    start_time = time.time()

    loop = asyncio.get_event_loop()
    songs = get_songs(args.file)

    while True:
        next_songs = list(itertools.islice(songs, args.number))
        if not next_songs:
            break
        downloads = (download(song_no, args.dir, name, url) for song_no, name, url in next_songs)
        loop.run_until_complete(asyncio.gather(*downloads))

    logger.info(f'Program ran for {datetime.timedelta(seconds=int(time.time() - start_time))}.')


if __name__ == '__main__':
    main()
