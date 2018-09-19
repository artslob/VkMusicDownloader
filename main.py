import asyncio
import logging
import os


import aiofiles
import aiohttp


async def download_coroutine(session, name, url, chunk_size=1 << 15):
    try:
        async with session.get(url) as response:
            logging.info('downloading %s', name)
            filename = os.path.join('/E/Music/vk/', name)
            async with aiofiles.open(filename, 'wb') as file:
                while True:
                    chunk = await response.content.read(chunk_size)
                    if not chunk:
                        break
                    await file.write(chunk)
            logging.info('done %s', name)
            return await response.release()
    except aiohttp.client_exceptions.ClientError as e:
        logging.exception('error occurred')


async def download(loop, name, url):
    async with aiohttp.ClientSession(loop=loop) as session:
        await download_coroutine(session, name, url)


def main():
    logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(message)s')

    data = []
    with open('links_with_names.txt') as file:
        for line in file.readlines():
            name, url = (el.strip() for el in line.strip().split('\t'))
            name: str
            data.append((name.replace('/', ''), url))

    num = 10

    loop = asyncio.get_event_loop()
    for i in range(len(data) // num):
        low, upper = i * num, (i + 1) * num
        loop.run_until_complete(asyncio.gather(*(download(loop, name, url) for name, url in data[low:upper])))


if __name__ == '__main__':
    main()
