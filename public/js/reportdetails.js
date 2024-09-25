const projectName = 'survey-form';
localStorage.setItem('jiji', 'genny ');

const textFields = document.querySelectorAll('.mdc-text-field');
for (const textField of textFields) {
  mdc.textField.MDCTextField.attachTo(textField);
}



const selects = document.querySelectorAll('.mdc-select');
for (const select of selects) {
  mdc.select.MDCSelect.attachTo(select);
}

var radios = document.querySelectorAll('.mdc-radio');
for (var i = 0, radio; radio = radios[i]; i++) {
  new mdc.radio.MDCRadio(radio);
}