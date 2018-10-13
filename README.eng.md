# VK Music Downloader
The project is intended for use in russian social network VKontakte.  
Must to be read [disclaimer](#disclaimer).

Features:
1. Download audios from user's audio list or some open playlist by using only browser.
1. Save list of audios names to file and download this file on computer. This file will contain author and name of songs and their URLs. Songs name and her URL divided by tabulation – `\t`. However VK dinamically creates songs URL when song is started playing, that's why you can find song by this address only limited time.
1. Download audios from this text file by `python3` script. You need installed python3 interpretator.

## Instruction
### 1. Installation
If you only want to download audios using browser ([2.1](#21-download-audios-using-browser)) or save audios to text file ([2.2](#22-download-list-of-audios-as-text-file)), you can skip this installation.
1. Download source project code. You can achive this 2 ways:
   * Download and unzip [archive](../../archive/master.zip).
   * Or use git:
   ```bash
   git clone https://github.com/artslob/VkMusicDownloader.git
   ```
1. Check you have interpretator python3.6 (maybe some `3.x` version can be used too) and it is available from command line:
   ```bash
   # linux
   which python3
   python3 --version
   
   # windows
   where python3
   python3 --version
   ```
   Then install virtual environment:
   ```bash
   # unix
   cd VkMusicDownloader
   python3 -m venv vk_venv
   source vk_venv/bin/activate
   python3 -m pip install -r requirements.txt
   
   # windows
   cd VkMusicDownloader
   python3 -m venv vk_venv
   vk_venv\Scripts\activate.bat
   python3 -m pip install -r requirements.txt
   ```

### 2. Usage
#### 2.1 Download audios using browser
1. Open content of vk-audio-downloader.js file: [ссылка](../../raw/master/js-handlers/vk-audio-downloader-file.js). Select all text (`Ctrl+A`) and copy.
1. Go to page audio page.
1. Go to bottom of the page. (all audios would be preloaded) (press PageDown button)
1. Open browser console. (`F12` -> Console or `Ctrl+Shift+J`)
1. Paste code.
1. If you want to load only first N (recently added) audios then scroll to top of pasted code and find line `var VK_DOWNLOADER_DOWNLOAD_LATEST = 0;`. Replace `0` to desired integer. For example: `var VK_DOWNLOADER_DOWNLOAD_LATEST = 50;`, then only first 50 audios would be downloaded.
1. Press Enter. Download begins...
1. Browser can ask for permission to download files, you shuld accept it.
1. Leave browser tab open for a while. It's desirable for tab to be focused.

#### 2.2 Download list of audios as text file.
Similar to download audios [using only browser](#21-download-audios-using-browser), but copy content of another file: [link](../../raw/master/js-handlers/vk-audio-downloader-text.js).  
At the end of download should appear window with offering to download text file `audios.txt`. If window didn't appear, then scroll to the page bottom, there, probably of left and lower side of screen, should be link with `audios.txt` name. Click it.

#### 2.3 Download audios from text file using python.
In previous step you downloaded [file](#22-download-list-of-audios-as-text-file) with list of audios names and their URLs, also installed virtual environment and activated it ([link](#1-installation)). Now you can use script.  
To get help on script parameters run `python3 main.py -h`.
Script will use parameter values by default if these not provided.  
Usage example:
```bash
python3 main.py -f /some/directory/audios.txt -d /where/to/save/audios/ -vv
```
`-f` – path to file with audios list. By default script looking for `audios.txt` in the same directory with script `main.py`.  
`-d` – path to directory where audio files would be saved. By default it is same directory with `main.py`.  
`-vv` – means high level of logging. Script will print all available information about his execution. Also you can save log to file using `-l` parameter.  

Current help (when script file is located at `/tmp`):
```
usage: main.py [-h] [-d DIR] [-f FILE] [-n NUMBER] [-l LOGFILE] [-v]

Download audios from text file with links.

optional arguments:
  -h, --help            show this help message and exit
  -d DIR, --dir DIR     Destination directory where audios are saved. Default:
                        /tmp.
  -f FILE, --file FILE  File that contains names of songs and their urls. Can
                        be set to stdin with value '-'. Default:
                        /tmp/audios.txt.
  -n NUMBER, --number NUMBER
                        Number of files that downloading at the same time.
                        Default: 10.
  -l LOGFILE, --logfile LOGFILE
                        Writable file for logging. By default set to stdout
                        with value '-'.
  -v, --verbose         Set level of logging. You can increase level by
                        repeating key. Levels by number: default: WARNING, -v:
                        INFO, -vv: DEBUG
```
## License
[MIT License](LICENSE.txt)

## Gratitude
[@abler](https://github.com/abler98) for original [script](https://gist.github.com/abler98/2fbeee9f7bd056bbe6c485041370c556).  
[@fizvlad](https://github.com/fizvlad) for [fork](https://gist.github.com/fizvlad/4c2eb98b5fb12a6a975d27b0bfcd9fcf) of original script, from which was made [vk-audio-downloader.js](vk-audio-downloader.js).  

## Disclaimer
1. Social network VKontakte referred in this README and project is fiction social network and is not related to [vk.com](https://vk.com). All instructions has no relation with real life.
1. Source code is open and free; information is presented for familiarization.
1. Access to resource and source code, usage of code is provided only by yours discretion with no warranty.
1. Author(s) do not bear any responsibility for the usage, distribution and other activities.
1. Reading, correction and other activities with this content may violate the laws of your country of residence and also a user agreement concluded between you and fictional and, possibly, the real social network VKontakte.
1. All text is created using random text generation. ~~Truth~~

## Ave, Caesar, morituri te salutant
![durov](https://user-images.githubusercontent.com/16637122/46695946-9a504280-cc19-11e8-95a3-02d1d97fe01a.jpg "Make vk great again!")
