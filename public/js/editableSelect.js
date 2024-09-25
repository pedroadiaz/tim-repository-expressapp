
var arrowImage = '../tempArrowDown.png';	
var arrowImageOver = '../tempArrowDown.png';
var arrowImageDown = '../tempArrow.png';	


var selectBoxIds = 0;
var currentlyOpenedOptionBox = false;
var editableSelect_activeArrow = false;

var activeOption;

function selectBox_switchImageUrl() {
    if (this.src.indexOf(arrowImage) >= 0) {
        this.src = this.src.replace(arrowImage, arrowImageOver);
    } else {
        this.src = this.src.replace(arrowImageOver, arrowImage);
    }
}

function selectBox_showOptions() {
    if (editableSelect_activeArrow && editableSelect_activeArrow != this) {
        editableSelect_activeArrow.src = arrowImage;

    }
    editableSelect_activeArrow = this;

    var numId = this.id.replace(/[^\d]/g, '');
    var optionDiv = document.getElementById('selectBoxOptions' + numId);
    if (optionDiv.style.display == 'block') {
        optionDiv.style.display = 'none';
        if (navigator.userAgent.indexOf('MSIE') >= 0) document.getElementById('selectBoxIframe' + numId).style.display = 'none';
        this.src = arrowImageOver;

        this.parentNode.style.zIndex = 1 - numId;
    } else {
        optionDiv.style.display = 'block';
        if (navigator.userAgent.indexOf('MSIE') >= 0) document.getElementById('selectBoxIframe' + numId).style.display = 'block';
        this.src = arrowImageDown;
        if (currentlyOpenedOptionBox && currentlyOpenedOptionBox != optionDiv) currentlyOpenedOptionBox.style.display = 'none';
        currentlyOpenedOptionBox = optionDiv;

        this.parentNode.style.zIndex = 1000;
    }
}

function selectOptionValue() {
    var parentNode = this.parentNode.parentNode;
    var textInput = parentNode.getElementsByTagName('INPUT')[0];
    textInput.value = this.innerText;
    this.parentNode.style.display = 'none';
    document.getElementById('arrowSelectBox' + parentNode.id.replace(/[^\d]/g, '')).src = arrowImageOver;

    if (navigator.userAgent.indexOf('MSIE') >= 0) document.getElementById('selectBoxIframe' + parentNode.id.replace(/[^\d]/g, '')).style.display = 'none';
}
function highlightSelectBoxOption() {
    if (this.style.backgroundColor == '#316AC5') {
        this.style.backgroundColor = '';
        this.style.color = '';
    } else {
        this.style.backgroundColor = '#316AC5';
        this.style.color = '#FFF';
    }

    if (activeOption) {
        activeOption.style.backgroundColor = '';
        activeOption.style.color = '';
    }
    activeOption = this;

}

function createEditableSelect(dest) {
    dest.className = 'selectBoxInput';
    var mainDiv = document.createElement('DIV');
    mainDiv.style.styleFloat = 'left';
    
    mainDiv.style.position = 'relative';
    mainDiv.id = 'selectBox' + selectBoxIds;
    mainDiv.setAttribute('selectBoxIds', selectBoxIds);
    var parent = dest.parentNode;
    parent.insertBefore(mainDiv, dest);
    mainDiv.appendChild(dest);
    mainDiv.className = 'selectBox';
    
    mainDiv.style.zIndex = 1 - selectBoxIds;

    var img = document.createElement('IMG');
    img.src = arrowImage;
    img.className = 'selectBoxArrow';

    img.onmouseover = selectBox_switchImageUrl;
    img.onmouseout = selectBox_switchImageUrl;
    img.onclick = selectBox_showOptions;
    img.id = 'arrowSelectBox' + selectBoxIds;

    mainDiv.appendChild(img);

    var optionContainerDiv = document.createElement('DIV');
    optionContainerDiv.id = 'selectBoxOptions' + selectBoxIds;
    optionContainerDiv.setAttribute('selectBoxIds', selectBoxIds);
    optionContainerDiv.className = 'selectBoxOptionContainer';
    
    mainDiv.appendChild(optionContainerDiv);

    if (navigator.userAgent.indexOf('MSIE') >= 0) {
        var iframe = document.createElement('<IFRAME src="about:blank" frameborder=0>');
        
        iframe.style.height = optionContainerDiv.offsetHeight + 'px';
        iframe.style.display = 'none';
        iframe.id = 'selectBoxIframe' + selectBoxIds;
        mainDiv.appendChild(iframe);
    }

    if (dest.getAttribute('selectBoxOptions')) {
        var options = dest.getAttribute('selectBoxOptions').split(';');
        var optionsTotalHeight = 0;
        var optionArray = new Array();
        for (var i = 0; i < options.length; i++) {
            var anOption = document.createElement('DIV');
            anOption.innerHTML = options[i];
            anOption.className = 'selectBoxAnOption';
            anOption.onclick = selectOptionValue;
            
            anOption.onmouseover = highlightSelectBoxOption;
            optionContainerDiv.appendChild(anOption);
            optionsTotalHeight = optionsTotalHeight + anOption.offsetHeight;
            optionArray.push(anOption);
        }
        
        var customOptions = dest.getAttribute('selectBoxOptionsCustom').split(';');
        for (var i = 0; i < customOptions.length; i++) {
            
            var newOption = document.createElement('DIV');
            newOption.innerHTML = customOptions[i];
            newOption.className = 'selectBoxAnOption selectBoxAnOptionCustom';
            newOption.setAttribute('custom', 'true');
            newOption.onclick = selectOptionValue;
            newOption.onmouseover = highlightSelectBoxOption;

            let trashCan = document.createElement('i');
            trashCan.className = 'fa fa-trash selectBoxTrash';
            trashCan.style.position = 'absolute';
            trashCan.style.top = '2px';
            trashCan.style.right = '2px';
            trashCan.style.cursor = 'pointer';
            
            trashCan.style.fontSize = '1rem';
            trashCan.onclick = function (event) {
                event.stopPropagation();
                newOption.parentNode.removeChild(newOption);
            };
            newOption.appendChild(trashCan);
            optionContainerDiv.appendChild(newOption);
        }


        if (optionsTotalHeight > optionContainerDiv.offsetHeight) {
            for (var i = 0; i < optionArray.length; i++) {
                optionArray[i].style.width = optionContainerDiv.style.width.replace('px', '') - 22 + 'px';
            }
        }
        optionContainerDiv.style.display = 'none';
        optionContainerDiv.style.visibility = 'visible';
    }

    let addNewBtn = null;
    createAddNewBtn(selectBoxIds);

    function createAddNewBtn(selectBoxIds) {
        var anOption = document.createElement('DIV');
        addNewBtn = anOption;
        anOption.id = 'selectBoxAdd' + selectBoxIds;
        anOption.innerHTML = 'Add New';
        anOption.className = 'selectBoxAdd';
        anOption.onclick = showAddNewOptionInput;
        anOption.onmouseover = highlightSelectBoxOption;
        let optionContainerDiv = document.getElementById('selectBoxOptions' + selectBoxIds);
        optionContainerDiv.appendChild(anOption);
        optionsTotalHeight = optionsTotalHeight + anOption.offsetHeight;

        optionArray.push(anOption);
    }

    function showAddNewOptionInput() {
        
        addNewBtn.style.display = 'none';

        var input = document.createElement('input');
        input.id = 'selectBoxAddInput';
        input.type = 'text';
        input.className = 'selectBoxAddInput';
        input.onblur = cancelAddNewOption;
        input.onkeypress = checkForEnter;

        let optionContainerDiv = this.parentNode;
        optionContainerDiv.appendChild(input);
        input.focus();
    }

    function checkForEnter(event) {
        if (!event) var event = window.event;
        var keyCode = event.keyCode;
        if (keyCode == 13) {
            let selectBoxId = this.parentNode.getAttribute('selectBoxIds');
            addNewOption(selectBoxId, this);
        }
        
        if (keyCode == 27) {
            let optionContainerDiv = this.parentNode;
            optionContainerDiv.removeChild(this);
            let theAddNewBtn = addNewBtn;
            theAddNewBtn.style.display = 'inline-block';
            optionContainerDiv.appendChild(theAddNewBtn);
        }
    }

    function addNewOption() {
        let input = document.getElementById('selectBoxAddInput');
        var newOption = document.createElement('DIV');
        newOption.innerHTML = input.value;
        newOption.className = 'selectBoxAnOption selectBoxAnOptionCustom';
        newOption.setAttribute('custom', 'true');
        newOption.onclick = selectOptionValue;
        newOption.onmouseover = highlightSelectBoxOption;

        let trashCan = document.createElement('i');
        trashCan.className = 'fa fa-trash selectBoxTrash';
        trashCan.style.position = 'absolute';
        trashCan.style.top = '2px';
        trashCan.style.right = '2px';
        trashCan.style.cursor = 'pointer';
        
        trashCan.style.fontSize = '1rem';
        trashCan.onclick = function (event) {
            event.stopPropagation();
            newOption.parentNode.removeChild(newOption);
        };
        newOption.appendChild(trashCan);

        let optionContainerDiv = input.parentNode;
        optionContainerDiv.insertBefore(newOption, input);
        input.parentNode.removeChild(input);
        newOption.style.width = optionContainerDiv.style.width.replace('px', '') - 22 + 'px';

        let theAddNewBtn = addNewBtn;
        console.log(addNewBtn);
        theAddNewBtn.style.display = 'inline-block';
        optionContainerDiv.appendChild(theAddNewBtn);
    }

    function cancelAddNewOption() {
        let optionContainerDiv = this.parentNode;
        optionContainerDiv.removeChild(this);
        let theAddNewBtn = addNewBtn;
        theAddNewBtn.style.display = 'inline-block';
        optionContainerDiv.appendChild(theAddNewBtn);
    }

    selectBoxIds = selectBoxIds + 1;
}
