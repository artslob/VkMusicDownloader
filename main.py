import asyncio
import logging
from contextlib import closing

import aiohttp


@asyncio.coroutine
def download(name, url, session, semaphore, chunk_size=1 << 15):
    with (yield from semaphore):  # limit number of concurrent downloads
        filename = name
        logging.info('downloading %s', filename)
        response = yield from session.get(url)
        with closing(response), open(filename, 'wb') as file:
            while True:  # save file
                chunk = yield from response.content.read(chunk_size)
                if not chunk:
                    break
                file.write(chunk)
        logging.info('done %s', filename)
    return filename, (response.status, tuple(response.headers.items()))


def main():
    logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(message)s')

    data = []
    with open('links_with_names.txt') as file:
        for line in file.readlines()[:4]:
            name, url = (el.strip() for el in line.strip().split('\t'))
            data.append((name, url))

    with closing(asyncio.get_event_loop()) as loop, closing(aiohttp.ClientSession()) as session:
        semaphore = asyncio.Semaphore(4)
        download_tasks = (download(name, url, session, semaphore) for name, url in data)
        result = loop.run_until_complete(asyncio.gather(*download_tasks))


if __name__ == '__main__':
    main()
