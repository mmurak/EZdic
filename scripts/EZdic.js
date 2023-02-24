class GlobalManager {
    constructor() {
        this.controlArea = document.getElementById("ControlArea");
        this.dicSel = document.getElementById("DicSel");
        this.tocSel = document.getElementById("TOCSel");
        this.entryField = document.getElementById("EntryField");
        this.enterButton = document.getElementById("EnterButton");
        this.clearButton = document.getElementById("ClearButton");
        this.historySel = document.getElementById("HistorySel");
        this.bookmarkButton = document.getElementById("BookmarkButton");
        this.prevButton = document.getElementById("PrevButton");
        this.nextButton = document.getElementById("NextButton");
        this.imageArea = document.getElementById("ImageArea");
        this.fullSizedImageArea = document.getElementById("FullSizedImageArea");
        this.resourceRoot = "./resources/";
        this.indexRoot = "./indexStorage/";
        this.imagePrefix = "/";
        this.imageSuffix = "_0000";
        this.currentPage = 0;
        this.magnifierOn = false;
        this.bookmarkID = "dicViewerBookmark";
        this.historyID = "dicViewerHistory";
    }
}

const G = new GlobalManager();

window.addEventListener("load", function() {
    initialise();
});

function enableMagnifier(evt) {
    let fsi = document.querySelector(".fullsizedimage");
    fsi.style.opacity = 1;
    // set magnifier position
    fsi.style.top = (evt.offsetY - 200) + "px";
    fsi.style.left = (evt.offsetX - 350) + "px";
    // set area offset
    let newLensOffsetY = Math.floor((evt.offsetY * G.fullSizedImageArea.height / G.imageArea.height) * -1 + 200);
    let newLensOffsetX = Math.floor((evt.offsetX * G.fullSizedImageArea.width / G.imageArea.width) * -1 + 350);
    let fsic = document.querySelector(".fsimage");
    fsic.style.top = (newLensOffsetY) + "px";
    fsic.style.left = (newLensOffsetX) + "px";
}

function initialise() {
    G.imageArea.addEventListener("mousedown", function(evt) {
        if (G.magnifierOn) {
            G.magnifierOn = false;
            document.querySelector(".fullsizedimage").style.opacity = 0;
        } else {
            G.magnifierOn = true;
            enableMagnifier(evt);
        }
    });

    G.imageArea.addEventListener("mousemove", function(evt) {
        if (G.magnifierOn) {
            enableMagnifier(evt);
        }
    }, false);

    G.imageArea.addEventListener("mouseout", function(evt) {
        document.querySelector(".fullsizedimage").style.opacity = 0;
        G.magnifierOn = false;
    }, false);

    document.addEventListener("keydown", function(evt) {
        let kc;
        if (evt) {
            kc = evt.keyCode;
        } else {
            kc = event.keyCode;
        }
        if (kc == 27) {
            clearField();
        } else if (kc == 38) {
            prevPage();
        } else if (kc == 40) {
            nextPage();
        } else {
            return;
        }
        let fsi = document.querySelector(".fullsizedimage");
        fsi.style.opacity = 0;
        G.magnifierOn = false;
        evt.preventDefault();
    });

    G.bookmarkButton.addEventListener("click", function(evt) {
        bookmark(evt);
    });

    while (G.dicSel.lastChild) {
        G.dicSel.removeChild(G.dicSel.lastElementChild);
    }
    for (let i = 0; i < configInfo.length; i++) {
        let elem = document.createElement("option");
        elem.text = configInfo[i][0];
        elem.value = configInfo[i][1];
        G.dicSel.appendChild(elem);
    }
    G.dicSel.selectedIndex = 0;
    dicChange(1);

    let lsh = historyFromLocalStorage();
    loadHistory(lsh);
}

function clearField() {
    G.entryField.value ="";
    G.entryField.focus();
}

function dicChange(pno) {
    let oldDicData = document.getElementById("DicData");
    if (oldDicData) oldDicData.remove();
    let script = document.createElement("script");
    script.id = "DicData";
    script.type = "text/javascript";
    script.src = G.indexRoot + configInfo[G.dicSel.selectedIndex][1] + ".js";
    script.onload = function() {
        initialiseDic();
        G.currentPage = pno;
    };
    let firstScript = document.getElementsByTagName( 'script' )[ 0 ];
    firstScript.parentNode.insertBefore(script, firstScript);
//    document.head.appendChild(script);
}

function constructSelector(array) {
    for (let i = 0; i < array.length; i++) {
        let elem = document.createElement("option");
        elem.text = array[i][0];
        elem.value = array[i][1];
        G.tocSel.appendChild(elem);
    }
}

function initialiseDic() {
    // erase existing entries
    G.entryField.focus();
    while (G.tocSel.lastChild) {
        G.tocSel.removeChild(G.tocSel.lastElementChild);
    }

    G.tocSel.appendChild(document.createElement("option"));
    constructSelector(indexData[0]);
    constructSelector(indexData[2]);
}

function tocChange(pno) {
    if (pno == "")  return;
    G.currentPage = Number(pno);
    loadImage(pno);
}

function loadImage(pno) {
    pno= ("0000" + pno).slice(-4);
    G.magnifierOn = false;
    G.imageArea.src = G.resourceRoot + configInfo[G.dicSel.selectedIndex][1] + G.imagePrefix + pno + G.imageSuffix + ".jpg";
    G.fullSizedImageArea.src = G.resourceRoot + configInfo[G.dicSel.selectedIndex][1] + G.imagePrefix + pno + G.imageSuffix + ".jpg";
}

function getIndex(targetEntry) {
    let target = targetEntry.trim().toLowerCase();
    target = target.replaceAll(/[^a-z]/g, "");
    for (let i = 0; i < indexData[1].length; i++) {
        if (indexData[1][i][0] > target) {
            return indexData[1][i][1] - 1;
        } else if (indexData[1][i][0] == target) {
            return indexData[1][i][1];
        }
    }
    return indexData[1][indexData[1].length - 1][1];
}

function search() {
    G.tocSel.selectedIndex = 0;
    let targetEntry = G.entryField.value;
    let pno = getIndex(targetEntry);
    if (pno >= 1) {
        G.currentPage = pno;
        loadImage(pno);
    }
    let lsh = historyFromLocalStorage();
    lsh = lsh.filter(function(val) {
        return val != targetEntry;
    });
    lsh.unshift(targetEntry);
    lsh = lsh.slice(0, 50);
    loadHistory(lsh)
    localStorage.setItem(G.historyID, JSON.stringify(lsh));
}

function historyFromLocalStorage() {
    let lsh = localStorage.getItem(G.historyID);
    if (lsh == null) {
        lsh = [];
    } else {
        lsh = JSON.parse(lsh);
    }
    return lsh;
}

function loadHistory(lsh) {
    while (G.historySel.lastChild) {
        G.historySel.removeChild(G.historySel.lastElementChild);
    }
    let harray = ["--検索履歴--"].concat(lsh);
    for (let hentry of harray) {
        let elem = document.createElement("option");
        elem.text = hentry;
        elem.value = hentry;
        G.historySel.appendChild(elem);
    }
}

function historySearch(val) {
    if (val == "--検索履歴--")  return;
    G.entryField.value = val;
    search();
}

function prevPage() {
    if (G.currentPage > 1) {
        G.currentPage -= 1;
        loadImage(G.currentPage);
    }
}

function nextPage() {
    if (G.currentPage < maxPage) {
        G.currentPage += 1;
        loadImage(G.currentPage);
    }
}

function bookmark(evt) {
    if (evt.shiftKey) {
        let bookmarkData = { "dic" : G.dicSel.selectedIndex, "page": G.currentPage};
        localStorage.setItem(G.bookmarkID, JSON.stringify(bookmarkData));
    } else {
        let lsv = localStorage.getItem(G.bookmarkID);
        if (lsv == null) return;
        let bookmarkData = JSON.parse(lsv);
        G.dicSel.selectedIndex = Number(bookmarkData["dic"]);
        let pno = Number(bookmarkData["page"]);
        dicChange(pno);
        loadImage(pno);
        clearField();
    }
}

