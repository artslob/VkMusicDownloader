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
*/


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
// Настройки
// -----------------------------------------------------------------------------
var VK_DOWLOADER_DOWNLOAD_LATEST = 0; // Если потребуется загрузить только N последних аудиозаписей, укажите N. Иначе укажите 0
var VK_DOWNLOADER_START_TIMEOUT = 2000; // Промежуток времени, отведённый на подгрузку скриптов (мс)
var VK_DOWNLOADER_TRIGGER_INTERVAL = 500; // Интервал между переходами по аудиозаписям (мс)
var VK_DOWLOADER_PLAYER_TIMEOUT = 500; // Время работы плеера ВК (мс)


// -----------------------------------------------------------------------------
// Вспомогательные функции
// -----------------------------------------------------------------------------

// Проверка на наличие окна с плейлистом
function if_playlist() {
    return $(".ap_layer_wrap").css("display") === "block";
}

// Вызов скрипта ВК и получение ссылки на скачивание
function vk_downloader_get_links(audios, handler, callback) {
    let i = 0;
    let interval = setInterval(
        function () {
            if (i >= audios.length || (VK_DOWLOADER_DOWNLOAD_LATEST !== 0 && i >= VK_DOWLOADER_DOWNLOAD_LATEST)) {
                if (typeof callback === "function") {
                    callback();
                }
                clearInterval(interval);
                return;
            }
            let newEvent = new Event("click");
            audios[i].dispatchEvent(newEvent);
            getAudioPlayer().toggleAudio(audios[i], newEvent);
            setTimeout(function () {
                let performer = jQuery(audios[i]).find(".audio_row__performers").text().trim();
                let title = jQuery(audios[i]).find(".audio_row__title").text().trim();
                let url = getAudioPlayer()._impl._currentAudioEl.src;
                console.log("Downloading:  " + performer + " - " + title);
                handler(url, performer, title);
                i++;
            }, VK_DOWLOADER_PLAYER_TIMEOUT);
        },
        VK_DOWNLOADER_TRIGGER_INTERVAL + VK_DOWLOADER_PLAYER_TIMEOUT
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
    let elems;
    if (if_playlist()) {
        console.log("Загружаем аудиозаписи из открытого плейлиста");
        elems = jQuery(".ap_layer_wrap .audio_row_content");
    } else {
        elems = jQuery(".audio_row_content");
    }

    if (elems.length === 0) {
        console.log("Нет аудиозаписей!");
        return;
    }
    console.log("Найдено аудиозаписей: ", elems.length);
    if (VK_DOWLOADER_DOWNLOAD_LATEST) {
        console.log("Загружаем лишь " + VK_DOWLOADER_DOWNLOAD_LATEST + " последних записей");
        if (VK_DOWLOADER_DOWNLOAD_LATEST > elems.length) {
            console.log("Ошибка: Не все аудиозаписи могут быть загружены! Обновите страницу, опуститесь до дна списка и повторите снова");
            return;
        }
    }
    console.log(
        "Ожидаемое время загрузки: " +
        Math.round(((VK_DOWLOADER_DOWNLOAD_LATEST !== 0 ? VK_DOWLOADER_DOWNLOAD_LATEST : elems.length) * (VK_DOWNLOADER_TRIGGER_INTERVAL + VK_DOWLOADER_PLAYER_TIMEOUT)) / (1000)) +
        " секунд");

    vk_downloader_get_links(
        elems,
        function (url, performer, title) {
            let name = performer + " - " + title;
            vk_downloader_download_file(url, name, "audio/mp3");
        },
        function () {
            console.log("Все аудиозаписи скачаны!");
        }
    );
}


// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
setTimeout(vk_downloader_download_all_audio, VK_DOWNLOADER_START_TIMEOUT);
