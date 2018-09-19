//  Original source: https://gist.github.com/fizvlad/4c2eb98b5fb12a6a975d27b0bfcd9fcf
/*
    Инструкция по использованию:
    - Заходим в раздел с аудиозаписями
    - Листаем в самый низ (Чтобы прогрузились все аудиозаписи) (Можно зажать клавишу PageDown)
    - Открываем консоль браузера (F12 -> Консоль)
    - Вставляем код и нажимаем Enter
    - Скачивание началось...
    - Браузер может потребовать разрешение на сохранение файлов, необходимо подтвердить действие
    - Оставляем браузер на время прямо пропорциональное количеству аудиозаписей :)

    Важно! С открытой вкладкой ничего не делаем!

    Скрипт позволяет скачать файлы средствами браузера или сохранить список аудиозаписей в текстовый файл.
*/


// -----------------------------------------------------------------------------
// Настройки
// -----------------------------------------------------------------------------
var VK_DOWNLOADER_DOWNLOAD_LATEST = 0; // Если потребуется загрузить только N последних аудиозаписей, укажите N. Иначе укажите 0
var VK_DOWNLOADER_START_TIMEOUT = 2000; // Промежуток времени, отведённый на подгрузку скриптов (мс)
var VK_DOWNLOADER_TRIGGER_INTERVAL = 500; // Интервал между переходами по аудиозаписям (мс)
var VK_DOWNLOADER_PLAYER_TIMEOUT = 500; // Время работы плеера ВК (мс)
/* Определяет, каким образом будут скачиваться аудиозаписи.
Если 'TEXT', то будет загружен 1 текстовый файл, в котором будет список из названий аудиозаписей и их url.
Если 'FILE', то будут загружены все аудиозаписи разом средствами браузера. */
var VK_DOWNLOADER_HANDLER_TYPE = 'TEXT';


// -----------------------------------------------------------------------------
// Подключение jQuery и download.js
// -----------------------------------------------------------------------------
if (typeof vk_downloader_dependencies === "undefined") {
    var vk_downloader_dependencies = ["https://code.jquery.com/jquery-3.2.1.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/downloadjs/1.4.7/download.min.js"];

    for (let i = 0; i < vk_downloader_dependencies.length; i++) {
        let script = document.createElement('script');
        script.src = vk_downloader_dependencies[i];
        document.getElementsByTagName('head')[0].appendChild(script);
    }
}


// -----------------------------------------------------------------------------
// Вспомогательные функции
// -----------------------------------------------------------------------------

// Создаёт объект, предоставляющий интерфейс в зависимости от VK_DOWNLOADER_HANDLER_TYPE
function VkDownloaderCreateHandler() {
    let type = VK_DOWNLOADER_HANDLER_TYPE.toLowerCase();
    if (type === 'text') {
        this.array = [];
        this.handle = function (url, performer, title, is_blocked) {
            let name = performer + ' - ' + title;
            if (is_blocked) {
                console.log('BLOCKED: ' + name);
                return;
            }
            url = url.split('?extra=')[0];  // removing extra params
            this.array.push(name + '\t' + url);
        };
        this.callback = function () {
            let audios_txt = document.createElement('a');
            audios_txt.id = 'audios_txt';
            audios_txt.download = 'audios.txt';
            audios_txt.innerHTML = 'audios.txt';
            audios_txt.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.array.join('\n'));
            document.getElementsByTagName('body')[0].appendChild(audios_txt);
            audios_txt.click();
        };
    }
    else if (type === 'file') {
        this.handle = function (url, performer, title, is_blocked) {
            let name = performer + ' - ' + title;
            if (is_blocked) {
                console.log('BLOCKED: ' + name);
                return;
            }
            vk_downloader_download_file(url, name, 'audio/mp3');
        };
        this.callback = function () {
        };
    }
    else {
        throw new Error("VK_DOWNLOADER_HANDLER_TYPE должно быть 'TEXT' или 'FILE'!");
    }
}

// Проверка на наличие окна с плейлистом
function vk_downloader_if_playlist() {
    return $(".ap_layer_wrap").css("display") === "block";
}

function vk_downloader_check_is_blocked(audio) {
    let parent = audio.parentElement;
    if (parent.hasAttribute('classList')) {
        return parent.classList.contains('audio_claimed');
    }
    else {
        return parent.className.indexOf('audio_claimed') > -1;
    }
}

// Вызов скрипта ВК и получение ссылки на скачивание
function vk_downloader_get_links(audios, handler) {
    let i = 0;
    let num = vk_downloader_audios_max_number(audios);
    let interval = setInterval(
        function () {
            if (i >= num) {
                console.log("Все аудиозаписи скачаны!");
                clearInterval(interval);
                handler.callback();
                return;
            }
            let newEvent = new Event("click");
            audios[i].dispatchEvent(newEvent);
            getAudioPlayer().toggleAudio(audios[i], newEvent);
            setTimeout(function () {
                let performer = jQuery(audios[i]).find(".audio_row__performers").text().trim();
                let title = jQuery(audios[i]).find(".audio_row__title .audio_row__title_inner").text().trim();
                let url = getAudioPlayer()._impl._currentAudioEl.src;
                let is_blocked = vk_downloader_check_is_blocked(audios[i]);
                console.log('[' + (i + 1) + ' of ' + num + '] ' + performer + ' - ' + title);
                handler.handle(url, performer, title, is_blocked);
                i++;
            }, VK_DOWNLOADER_PLAYER_TIMEOUT);
        },
        VK_DOWNLOADER_TRIGGER_INTERVAL + VK_DOWNLOADER_PLAYER_TIMEOUT
    );
}

// Скачать отдельный файл
function vk_downloader_download_file(url, name, type, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    xhr.onload = function () {
        download(xhr.response, name + ".mp3", type);
        if (typeof callback === "function") {
            callback();
        }
    };
    /*
    // Отображение прогресса
    xhr.onprogress = function (e) {
        let progress = e.loaded * 100 / e.total;
        console.log( name, Math.round(progress, 2) + "%" );
    };
    */
    xhr.send();
}

// Скачать вcе аудиозаписи
function vk_downloader_download_all_audio() {
    let audios;
    if (vk_downloader_if_playlist()) {
        console.log("Загружаем аудиозаписи из открытого плейлиста");
        audios = jQuery(".ap_layer_wrap .audio_row_content");
    } else {
        audios = jQuery(".audio_row_content");
    }

    if (audios.length === 0) {
        console.log("Нет аудиозаписей!");
        return;
    }
    console.log("Найдено аудиозаписей: ", audios.length);
    if (VK_DOWNLOADER_DOWNLOAD_LATEST) {
        console.log("Загружаем лишь " + VK_DOWNLOADER_DOWNLOAD_LATEST + " последних записей");
        if (VK_DOWNLOADER_DOWNLOAD_LATEST < 0) {
            console.log("Ошибка: переменная 'VK_DOWNLOADER_DOWNLOAD_LATEST' не может быть отрицательна! " +
                "Обновите страницу, опуститесь до дна списка и повторите снова.");
            return;
        }
        if (VK_DOWNLOADER_DOWNLOAD_LATEST > audios.length) {
            console.log("Ошибка: переменная 'VK_DOWNLOADER_DOWNLOAD_LATEST' больше чем количество аудиозаписей! " +
                "Обновите страницу, опуститесь до дна списка и повторите снова.");
            return;
        }
    }
    console.log("Ожидаемое время загрузки: " + vk_downloader_expected_download_time(audios) + " секунд");

    let handler = new VkDownloaderCreateHandler();
    vk_downloader_get_links(audios, handler);
}

// Находит макс. кол-во аудиозаписей, которое может быть загружено
function vk_downloader_audios_max_number(audios) {
    if (VK_DOWNLOADER_DOWNLOAD_LATEST !== 0 && VK_DOWNLOADER_DOWNLOAD_LATEST <= audios.length)
        return VK_DOWNLOADER_DOWNLOAD_LATEST;

    return audios.length;
}

// Ожидаемое время загрузки аудиозаписей
function vk_downloader_expected_download_time(audios) {
    let num = vk_downloader_audios_max_number(audios);
    let ms = num * (VK_DOWNLOADER_TRIGGER_INTERVAL + VK_DOWNLOADER_PLAYER_TIMEOUT);
    let sec = ms / 1000;
    return Math.round(sec);
}


// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
console.trace();
setTimeout(vk_downloader_download_all_audio, VK_DOWNLOADER_START_TIMEOUT);
