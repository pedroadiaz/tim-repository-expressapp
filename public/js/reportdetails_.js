var topGradeLevel = -1;
var has;
var sec;
const gradeLevelTable = {
    0: "Pre-Kindergarten",
    1: "Kindergarten",
    2: "1st Grade",
    3: "2nd Grade",
    4: "3rd Grade",
    5: "4th Grade",
    6: "5th Grade",
    7: "6th Grade",
    8: "7th Grade",
    9: "8th Grade",
    10: "9th Grade",
    11: "10th Grade",
    12: "11th Grade",
    13: "12th Grade",
    14: "Adult Transition"
};
document.getElementById('customLogo').addEventListener('change', function (event) {

    var file = event.target.files[0];
    var formData = new FormData();
    formData.append('logo', file);

    fetch('/app/uploadLogo', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(result => {
            console.log('Success:', result);
            var img = document.createElement('img');
            img.id = 'customUserLogo';
            // Handle both S3 URLs (absolute) and local paths (relative)
            if (result.filename.startsWith('http://') || result.filename.startsWith('https://')) {
                img.src = result.filename; // S3 URL - use as-is
            } else {
                img.src = ".." + result.filename; // Local path - add relative prefix
            }

            img.onload = function () {
                var width = this.width;
                var height = this.height;
                console.log(width, height);
                img.setAttribute('data-width', width);
                img.setAttribute('data-height', height);
                img.style.width = '150px';
                img.style.cursor = 'pointer';
                img.title = 'Click to change logo';
                
                // Add click handler to allow editing the logo
                img.onclick = function() {
                    // Show the upload form again
                    document.getElementById('customLogo').style.display = 'block';
                    // Remove the current image
                    img.remove();
                    // Reset the file input
                    document.querySelector('input[name="logo"]').value = '';
                };
            }
            document.getElementById('customLogo').style.display = 'none';
            document.getElementById('customLogo').insertAdjacentElement('afterend', img);
        })
        .catch(error => {
            console.error('Error:', error);
        });
});



let reportUuid = "<%= reportUuid %>";
console.log(reportUuid);


fetch('/app/getReport', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        uuid: reportUuid
    })
})
    .then(response => response.json())
    .then(result => {
        let data = result.rows[0];
        console.log(data);
        let firstName = data["firstName"];
        let lastName = data["lastName"];
        document.getElementById('firstName').value = firstName;
        document.getElementById('lastName').value = lastName;
    });

let isSwappableEnabled = false;

function initializeSwappable() {
    const swappable = new Draggable.Swappable(document.querySelectorAll('.mdc-layout-grid__inner'), {
        draggable: '.shiftable',
        mirror: {
            constrainDimensions: true,
        },

        classes: {
            'sortable': 'sortable',
            'mirror': 'mirror',
            'dragging': 'dragging',
            'source': 'source',
            'handle': 'handle',
            'container': 'container',
            'clone': 'clone',
            'empty': 'empty',
            'placement': 'placement',
            'fixed': 'fixed',
            'shiftable': 'shiftable',
        },
    });

    swappable.on('swappable:stop', function (event) {
        console.log('swappable:stop');

        requestAnimationFrame(function () {
            var layout = serializeLayout();
            localStorage.setItem('lay', JSON.stringify(layout));
        });



    });

    return swappable;
}

let swappableInstance = null;



function checkSwappable(enable) {
    if (enable) {
        if (!swappableInstance) {
            swappableInstance = initializeSwappable();
        }
    } else {
        if (swappableInstance) {
            swappableInstance.destroy();
            swappableInstance = null;
        }
    }
}

function toggleSwappable() {
    console.log('Toggling swappable');
    isSwappableEnabled = !isSwappableEnabled;
    checkSwappable(isSwappableEnabled);

    var button = document.getElementById('edit_layout_btn');
    if (isSwappableEnabled) {
        button.textContent = 'Save Layout';
        button.style.backgroundColor = '#01771F';
        button.style.color = 'white';
        button.style.border = '1px solid #001100';
    } else {
        button.textContent = 'Edit Layout';
        button.style.backgroundColor = 'var(--mdc-theme-primary, #6200ee)';
        button.style.color = 'white';
        button.style.border = '1px solid var(--mdc-theme-primary, #6200ee)';
    }
}

let holding = false;

document.getElementById('name').addEventListener('mousedown', function () {
    console.log("This DOES fire when we have swappable on, maybe we can handle deleting elements thorugh here");
    console.log("TEST");

    holding = true;
    setTimeout(function () {
        if (holding) {
            console.log("TEST");
            isSwappableEnabled = true;
            checkSwappable(isSwappableEnabled);
        }
    }, 2000);
});
document.getElementById('name').addEventListener('mouseup', function () {
    holding = false;
});


function removeField(event, element) {


    console.log("Removing " + element.id);
    element.remove();
}
var iCount = 0;
function addField() {

    var spacer = document.createElement('div');
    spacer.id = 'spacer' + iCount;

    spacer.className = 'mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-6-tablet mdc-layout-grid__cell--span-6-desktop report-spacer shiftable';
    spacer.innerHTML = '<div class="report-widget-deletable"><button onclick="removeField(event, this.parentNode.parentNode)" class="mdc-button mdc-button--raised" type="button" style="background-color: #b62217;">X</button></div>';
    document.querySelector('.mdc-layout-grid__inner').appendChild(spacer);
    spacer.style.height = '60px';

    iCount++;
}


document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded');
    var savedLayout = localStorage.getItem('lay');
    if (savedLayout) {
        restoreLayout(JSON.parse(savedLayout));
    }

    console.log("Attaching listeners");


    document.getElementById('grade').addEventListener('MDCSelect:change', function (event) {

        
        changeGradeChoice();
        buildGradeLevelElements(event.detail.value);
    });



    console.log("Building areas of concern");
    let concernElem = document.getElementById('areas_of_concern');
    let defaultConcerns = ['Reading', 'Math', 'Behavior', 'Listening', 'Writing', 'Motor', 'Attention', 'Adaptive Functioning', 'Cognition', 'Memory', 'Speech', 'Social Emotional'];
    defaultConcerns.forEach(function (concern) {
        let concernElem = document.createElement('div');
        concernElem.className = 'mdc-form-field checkboxGridField checkboxGridField4s';
        concernElem.innerHTML = getConcernCheckboxElement(concern);

        concernElem.querySelector('.checkboxGridLabel').textContent = concern;
        document.getElementById('areas_of_concern').appendChild(concernElem);
    });

    let addConcernElem = document.createElement('div');
    addConcernElem.className = 'mdc-form-field checkboxGridField4s';
    addConcernElem.innerHTML = `<div class="checkbox-grid-addition"><div class="input-plus-button-container"><input id="addCheckboxToAreasOfConcernInput" type="text" class="custom-checkbox-grid-input" placeholder="Enter text here" /><button id="addCheckboxToAreasOfConcernBtn" class="plus-button">+</button></div></div></div>`;
    document.getElementById('areas_of_concern').appendChild(addConcernElem);

    document.getElementById('addCheckboxToAreasOfConcernBtn').addEventListener('click', function () {
        let input = document.querySelector('.custom-checkbox-grid-input');
        let concern = input.value;
        addConcernCheckbox(concern);
        input.value = '';
    });
    document.getElementById('addCheckboxToAreasOfConcernInput').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            let input = document.querySelector('.custom-checkbox-grid-input');
            let concern = input.value;
            addConcernCheckbox(concern);
            input.value = '';
        }
    });

    console.log("Building interventions attempted");
    let interventionsElem = document.getElementById('interventions_attempted');
    let defaultInterventions = ['Individualized behavior plans', 'Conflict resolution training', 'Peer mentoring programs', 'Supplemental instruction or remedial programs', 'Counseling or therapy sessions', 'Peer meditation or buddy systems', 'Structured study skills support', 'Social skills training or groups', 'Behavior management strategies', 'Differentiated instruction', 'One-on-one tutoring', 'Extended time for assignments or tests', 'Small group instruction', 'Modified assignments or assessments', 'Assistive technology use'];

    defaultInterventions.forEach(function (intervention) {
        let interventionElem = document.createElement('div');
        interventionElem.className = 'mdc-form-field checkboxGridField checkboxGridField3s';
        interventionElem.innerHTML = getInterventionsElement(intervention);
        interventionsElem.appendChild(interventionElem);
    });
    

    console.log("Building Evaluation areas");
    let evaluationElem = document.getElementById('evaluation_areas');
    let defaultEvaluations = ["Academic Achievement", "Health", "Intellectual Development", "Language Speech/Communication Development", "Motor Development", "Social-Emotional/Behavior", "Adaptive Behavior"];

    defaultEvaluations.forEach(function (evaluation) {
        let evaluationElem = document.createElement('div');
        evaluationElem.className = 'mdc-form-field checkboxGridField';
        evaluationElem.innerHTML = getEvaluationElement(evaluation);
        document.getElementById('evaluation_areas').appendChild(evaluationElem);
    });

    let addEvaluationElem = document.createElement('div');
    addEvaluationElem.id = 'addEvaluationElem';
    addEvaluationElem.className = 'mdc-form-field';
    addEvaluationElem.innerHTML = `<div class="checkbox-grid-addition"><div class="input-plus-button-container"><input id="addCheckboxToEvaluationAreasInput" type="text" class="custom-checkbox-grid-input" placeholder="Enter text here" /><button id="addCheckboxToEvaluationAreasBtn" class="plus-button">+</button></div></div></div>`;
    document.getElementById('evaluation_areas').appendChild(addEvaluationElem);

    document.getElementById('addCheckboxToEvaluationAreasBtn').addEventListener('click', function () {
        let input = document.getElementById('addCheckboxToEvaluationAreasInput');
        let evaluation = input.value;
        let newEvaluationElem = document.createElement('div');
        newEvaluationElem.className = 'mdc-form-field checkboxGridField';
        newEvaluationElem.innerHTML = getEvaluationElement(evaluation);
        document.getElementById('evaluation_areas').insertBefore(newEvaluationElem, addEvaluationElem);
        input.value = '';
    });
    document.getElementById('addCheckboxToEvaluationAreasInput').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            let input = document.getElementById('addCheckboxToEvaluationAreasInput');
            let evaluation = input.value;
            let newEvaluationElem = document.createElement('div');
            newEvaluationElem.className = 'mdc-form-field checkboxGridField';
            newEvaluationElem.innerHTML = getEvaluationElement(evaluation);
            document.getElementById('evaluation_areas').insertBefore(newEvaluationElem, addEvaluationElem);
            input.value = '';
        }
    });

    console.log("Building Psychoeducational Procedures");
    let psychoeducationalProcedures = document.getElementById('psychoeducational_procedures');
    let psychoeducationalProceduresList = document.getElementById('psychoeducationalProceduresList');
    let psychoeducationalProceduresAddBtn = document.getElementById('psychoeducationalProceduresAddBtn');

    // Default procedures removed - users must add procedures manually using the dropdown

    psychoeducationalProceduresAddBtn.addEventListener('click', function () {
        let input = document.getElementById('psychoeducationalProceduresSelect').querySelector('.mdc-select__selected-text');
        let procedure = input.textContent;
        let newProcedureElem = document.createElement('li');
        newProcedureElem.className = 'mdc-list-item';
        newProcedureElem.setAttribute('data-value', procedure);
        newProcedureElem.innerHTML = getProcedureElement(procedure);
        psychoeducationalProceduresList.appendChild(newProcedureElem);
        input.textContent = '';
    });


    let histories_attendanceHistory_body = document.getElementById('histories_attendanceHistory_body')
    histories_attendanceHistory_body.addEventListener('change', function (event) {
        console.log('Recalculate Percentage of Attendance');

        let rows = histories_attendanceHistory_body.querySelectorAll('tr');
        console.log(rows);
        for (let i = 0; i < rows.length; i++) {
            let daysEnrolled = rows[i].querySelector('input').value;
            console.log('Days Enrolled: ', daysEnrolled);
            let tardies = rows[i].querySelectorAll('input')[1].value;
            console.log('Tardies: ', tardies);
            let daysAbsent = rows[i].querySelectorAll('input')[2].value;
            console.log('Days Absent: ', daysAbsent);
            let percentage = (daysEnrolled - daysAbsent) / daysEnrolled * 100;
            console.log('Percentage of Attendance: ', percentage);

            if (isNaN(percentage) || !isFinite(percentage)) {
                rows[i].querySelector('.table-badge').textContent = 'None';

                rows[i].querySelector('.table-badge').classList.remove('table-badge--red');
                rows[i].querySelector('.table-badge').classList.remove('table-badge--yellow');
                rows[i].querySelector('.table-badge').classList.remove('table-badge--green');
                continue;
            }
            rows[i].querySelector('.table-badge').textContent = Math.round(percentage) + '%';

            if (percentage >= 90) {
                rows[i].querySelector('.table-badge').classList.add('table-badge--green');
                rows[i].querySelector('.table-badge').classList.remove('table-badge--yellow');
                rows[i].querySelector('.table-badge').classList.remove('table-badge--red');
            } else if (percentage >= 70) {
                rows[i].querySelector('.table-badge').classList.add('table-badge--yellow');
                rows[i].querySelector('.table-badge').classList.remove('table-badge--green');
                rows[i].querySelector('.table-badge').classList.remove('table-badge--red');
            } else {
                rows[i].querySelector('.table-badge').classList.add('table-badge--red');
                rows[i].querySelector('.table-badge').classList.remove('table-badge--yellow');
                rows[i].querySelector('.table-badge').classList.remove('table-badge--green');
            }
        }
    });


    let histories_cfsInvolvement = document.getElementById('histories_cfsInvolvement');
    histories_cfsInvolvement.addEventListener('change', function (event) {
        document.getElementById('histories_cfsInvolvementMoreInformation').removeAttribute('data-dirty');
    });

    fetch('/app/getConsentStatus', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(result => {
            if (!result.status) {

                var consentModal = new mdc.dialog.MDCDialog(document.getElementById('consentModal'));
                consentModal.open();
            }
        });


    wiscTable = document.getElementById('wiscTable');

    wiscTable.addEventListener('change', function (event) {
        updateWiscTable();
    });
});

function consentToDisclaimer() {

    fetch('/app/setConsentStatus', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(result => {
            if (result.status != "success") {
                console.error('Failed to set consent status');
            }
        });
}


function serializeLayout() {
    console.log('Serializing layout');
    var layout = [];
    document.querySelectorAll('.mdc-layout-grid__inner > div').forEach(function (element, index) {
        if (element.id) {

            layout.push({id: element.id, order: index});
            console.log('Element ID: ', element.id, ' Order: ', index);
        }
    });


    return layout;
}

function restoreLayout(layout) {
    console.log('Restoring layout');
    const parent = document.querySelector('.mdc-layout-grid__inner');
    if (!parent) {
        console.error('Parent container not found');
        return;
    }

    let children = Array.from(parent.children);
    

    layout.sort((a, b) => a.order - b.order);

    layout.forEach(function (item) {
        console.log('Restoring element: ', item.id);
        const element = children.find(child => child.id === item.id);
        if (element) {

            element.setAttribute('data-sort-order', item.order);
            parent.appendChild(element);
        } else {
            console.error('Element not found: ', item.id);
        }
    });
}

function addPronouns(element, parentElement) {
    let pronounsField = document.createElement('div');
    pronounsField.className = 'fieldContainer';
    pronounsField.innerHTML = '<div class="fieldLabel">Pronouns:</div><label class="mdc-text-field mdc-text-field--filled w-100"><span class="mdc-text-field__ripple"></span><input id="pronounsInput" class="mdc-text-field__input" type="text" aria-labelledby="city-floating-label"><span class="mdc-floating-label" id="city-floating-label">Pronouns</span><span class="mdc-line-ripple"></span></label>';
    parentElement.appendChild(pronounsField);
    mdc.textField.MDCTextField.attachTo(pronounsField.querySelector('.mdc-text-field'));
    element.remove();

}

function removePronouns(element) {

    let parentElement = element.parentNode;
    let pronounsField = parentElement.querySelector('.fieldContainer');
    pronounsField.remove();
    let addPronounsButton = document.createElement('button');
    addPronounsButton.className = 'mdc-button mdc-button--raised';
    addPronounsButton.innerHTML = 'Add Pronouns <i class="fa fas-plus"><i/>';
    addPronounsButton.onclick = function () {
        addPronouns(addPronounsButton, parentElement);
    };
    parentElement.appendChild(addPronounsButton);
}

function submitCustomSelect(event, element, parentElement) {

    if (event.key === 'Enter') {
        let value = element.value;
        let selectText = parentElement.querySelector('.mdc-select__selected-text');
        selectText.textContent = value;


        document.body.click();
    }
}

function calculateAge(birthDate) {
    

    var ageDifMs = Date.now() - birthDate.getTime();
    var ageDate = new Date(ageDifMs);
    var years = Math.abs(ageDate.getUTCFullYear() - 1970);
    var months = ageDate.getUTCMonth();
    if (isNaN(years)) {
        return 'None';
    }
    return years + ' years and ' + months + ' months';
}

updateReportDetails();
setInterval(updateReportDetails, 3000);
var WiscChart;
var FirstName;
var customPronouns = false;
var objectPronoun = '';
var possessivePronoun = '';
var pluralPossessivePronoun = '';
var subjectPronoun = '';
var pronouns = '';

function updateReportDetails() {
    let reportTitle = document.getElementById('reportTitle').value;
    let reportTitleL = reportTitle.toLowerCase();

    let reportTitleCased = reportTitleL.replace(/\b\w/g, function (char) {
        return char.toUpperCase();
    });
    let reportTitleNoun = reportTitleL.startsWith('a') || reportTitleL.startsWith('e') || reportTitleL.startsWith('i') || reportTitleL.startsWith('o') || reportTitleL.startsWith('u');
    FirstName = document.getElementById('firstName').value;
    let gender = document.getElementById('gender').querySelector('.mdc-select__selected-text').textContent;
    let birth_date = document.getElementById('birth_date').querySelector('.mdc-text-field__input').value;
    let age = calculateAge(new Date(birth_date));
    let ageLabelElem = document.getElementById('age-label');
    ageLabelElem.innerHTML = age;
    let referredBy = document.getElementById('referred_by').querySelector('.mdc-select__selected-text').textContent;
    let placement = document.getElementById('placement').querySelector('.mdc-select__selected-text').textContent;
    let areasOfConcern = document.getElementById('areas_of_concern').querySelectorAll('.mdc-checkbox__native-control');
    let checkedAreasOfConcern = Array.from(areasOfConcern).filter(function (item) {
        return item.checked;
    }).map(function (item) {
        return item.id.toLowerCase();
    });
    let areasOfConcernString = checkedAreasOfConcern.reduce(function (acc, item, index) {
        if (index === 0) {
            return item;
        } else if (index === checkedAreasOfConcern.length - 1) {
            return acc + ' and ' + item;
        } else {
            return acc + ', ' + item;
        }
    }, '');
    let previousInterventions = document.getElementById('interventions_attempted').querySelectorAll('.mdc-checkbox__native-control');
    let checkedInterventions = Array.from(previousInterventions).filter(function (item) {
        return item.checked;
    }).map(function (item) {
        return item.id.toLowerCase();
    });
    let interventionsString = checkedInterventions.reduce(function (acc, item, index) {
        if (index === 0) {
            return item;
        } else if (index === checkedInterventions.length - 1) {
            return acc + ' and ' + item;
        } else {
            return acc + ', ' + item;
        }
    }, '');
    let evaluationAreas = document.getElementById('evaluation_areas').querySelectorAll('.mdc-checkbox__native-control');
    let checkedEvaluationAreas = Array.from(evaluationAreas).filter(function (item) {
        return item.checked;
    }).map(function (item) {
        return item.id.toLowerCase();
    });
    let evaluationAreasString = checkedEvaluationAreas.reduce(function (acc, item, index) {
        if (index === 0) {
            return item;
        } else if (index === checkedEvaluationAreas.length - 1) {
            return acc + ' and ' + item;
        } else {
            return acc + ', ' + item;
        }
    }, '');

    const ReportType = {
        INITIAL_REPORT: "initial-report",
        TRIENNIAL_REPORT: "triennial-report",
        OTHER_REPORT: "other-report"
    };
    let reportType = ReportType.OTHER_REPORT;
    if (reportTitleL.includes('initial')) {
        reportType = ReportType.INITIAL_REPORT;
    } else if (reportTitleL.includes('triennial') || reportTitleL.includes('tri-annual') || reportTitleL.includes('eligibility')) {
        reportType = ReportType.TRIENNIAL_REPORT;
    }

    let pronounsInput = document.getElementById('pronounsInput');
    let isPronounsFieldFocused = pronounsInput === document.activeElement;
    if (pronounsInput && pronounsInput.value.trim() !== '' && !isPronounsFieldFocused) {
        customPronouns = true;
        pronouns = pronounsInput.value;
        let pronounParts = pronouns.split('/').map(function (item) {
            return item.trim();
        });

        if (pronounParts.length === 5) {
            objectPronoun = pronounParts[0];
            possessivePronoun = pronounParts[2];
            pluralPossessivePronoun = pronounParts[3];
            subjectPronoun = pronounParts[1];
        } else if (pronounParts.length === 3) {
            objectPronoun = pronounParts[0];
            possessivePronoun = pronounParts[1];
            pluralPossessivePronoun = pronounParts[2];
            subjectPronoun = pronounParts[0];
        } else if (pronounParts.length === 2) {
            objectPronoun = pronounParts[0];
            possessivePronoun = pronounParts[1];
            pluralPossessivePronoun = pronounParts[1] + 's';
            subjectPronoun = pronounParts[0];
        } else {
            pronounsInput.value = '';
            console.error('Invalid pronouns input');

            alert('Invalid pronouns input. Please enter pronouns in the format "she/her", "he/him/his", or "they/them/their/theirs/themselves".');
        }
    } else {
        customPronouns = false;
        console.log(gender);
        if (gender == "Female") {
            objectPronoun = 'her';
            possessivePronoun = 'her';
            pluralPossessivePronoun = 'hers';
            subjectPronoun = 'she';
            pronouns = 'she/her/hers';
        } else {
            objectPronoun = 'him';
            possessivePronoun = 'his';
            pluralPossessivePronoun = 'his';
            subjectPronoun = 'he';
            pronouns = 'he/him/his';
        }
    }
    let possessivePronounCapped = possessivePronoun.charAt(0).toUpperCase() + possessivePronoun.slice(1);
    let subjectPronounCapped = subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1);

    console.log('First Name: ', FirstName, ' Pronouns: ', pronouns, ' Custom Pronouns: ', customPronouns);
    console.log('Object Pronoun: ', objectPronoun, ' Possessive Pronoun: ', possessivePronoun, ' Subject Pronoun: ', subjectPronoun);

    let evaluationAreasMoreInformationInput = document.getElementById('evaluationAreasMoreInformationInput');
    if (!evaluationAreasMoreInformationInput.getAttribute('data-dirty')) {
        let reasonForReferralMoreInfo = '';
        if (reportType === ReportType.INITIAL_REPORT) {
            let previousInterventions = '';
            if (checkedInterventions.length > 0) {
                previousInterventions = `The previous interventions consisted of ${interventionsString}. `;
            }

            if (FirstName.length > 0) {
                if (referredBy.length > 0) {
                    reasonForReferralMoreInfo += `${FirstName} was referred for ${reportTitleNoun ? "an" : "a"} ${reportTitleCased} `;
                    reasonForReferralMoreInfo += `by the ${referredBy}.`;
                } else {
                    reasonForReferralMoreInfo += `${FirstName} was referred for ${reportTitleNoun ? "an" : "a"} ${reportTitleCased}.`;
                }
            }
            if (areasOfConcernString.length > 0) {
                reasonForReferralMoreInfo += `because of ongoing concerns with ${possessivePronoun} ${areasOfConcernString} `;
            }
            if (interventionsString.length > 0) {
                reasonForReferralMoreInfo += `despite significant intervention in the school setting. The previous interventions consisted of ${interventionsString}. The results of this evaluation, along with other assessments, will assist in determining eligibility for special education services.`;
            }
            if (evaluationAreasString.length > 0) {
                reasonForReferralMoreInfo += `This evaluation will assess ${FirstName}'s ${evaluationAreasString} and will assist in the development of any appropriate interventions.`;
            }
        } else if (reportType === ReportType.TRIENNIAL_REPORT) {

            if (FirstName.length > 0) {
                reasonForReferralMoreInfo += `${FirstName} was referred for ${reportTitleNoun ? "an" : "a"} ${reportTitleCased} in order to re-determine eligibility for special education. `;
            }
            if (FirstName.length > 0 && placement.length > 0) {
                reasonForReferralMoreInfo += `${FirstName} previously qualified for special education under the educational classification of ${placement}. `;
            }
            if (evaluationAreasString.length > 0) {
                reasonForReferralMoreInfo += `This evaluation will assess ${FirstName}'s ${evaluationAreasString} and will assist in the development of any appropriate interventions.`;
            }
        }
        else {
            reasonForReferralMoreInfo = '';
        }

        evaluationAreasMoreInformationInput.value = reasonForReferralMoreInfo;
    }





    let records_familyComposition_description1 = document.getElementById('records_familyComposition_description1');
    let records_milestones_description1 = document.getElementById('records_milestones_description1');
    let records_milestones_description2 = document.getElementById('records_milestones_description2');
    let records_milestones_description3 = document.getElementById('records_milestones_description3');
    let records_milestones_description4 = document.getElementById('records_milestones_description4');
    let records_milestones_description5 = document.getElementById('records_milestones_description5');
    let records_milestones_description6 = document.getElementById('records_milestones_description6');
    records_familyComposition_description1.textContent = `People living in ${FirstName}'s Home`;
    records_milestones_description1.textContent = `${FirstName} began walking on ${possessivePronoun} own at`;
    records_milestones_description2.textContent = `${subjectPronounCapped} started to crawl when ${subjectPronoun} was`;
    records_milestones_description3.textContent = `And sat up at`;
    records_milestones_description4.textContent = `${FirstName} said ${possessivePronoun} first words at`;
    records_milestones_description5.textContent = `${subjectPronounCapped} put 2 or more words together when ${subjectPronoun} was`;
    records_milestones_description6.textContent = `${FirstName} was toilet trained when ${FirstName} was`;

    records_PersonsLivingInHome = document.querySelectorAll('.records_PersonLivingInHome');
    let familyMembers = [];

    records_PersonsLivingInHome.forEach(function (person) {
        let personName = person.querySelector('.mdc-select__selected-text').textContent;
        console.log(personName);
        personName = personName.toLowerCase().trim();
        familyMembers.push(personName);
    });
    let familyMembersString = familyMembers.reduce(function (acc, item, index) {
        if (index === 0) {
            return item;
        } else if (index === familyMembers.length - 1) {
            return acc + ' and ' + item;
        } else {
            return acc + ', ' + item;
        }
    }, '');


    let records_parent_guardian_occupations_parent1 = document.getElementById('records_occupationPerson1');
    let records_parent_guardian_occupations_parent2 = document.getElementById('records_occupationPerson2');
    let records_parent_guardian_occupation1 = document.getElementById('records_occupation1');
    let records_parent_guardian_occupation2 = document.getElementById('records_occupation2');
    let occupationPerson1 = records_parent_guardian_occupations_parent1.querySelector('.mdc-select__selected-text').textContent.toLowerCase();
    let occupationPerson2 = records_parent_guardian_occupations_parent2.querySelector('.mdc-select__selected-text').textContent.toLowerCase();
    let occupation1 = records_parent_guardian_occupation1.value.toLowerCase();
    let occupation2 = records_parent_guardian_occupation2.value.toLowerCase();



    let histories_medicalPsychiatricDiagnoses = document.querySelectorAll('.medicalDiagnosis');
    let medicalDiagnoses = [];
    histories_medicalPsychiatricDiagnoses.forEach(function (diagnosis) {
        let diagnosisName = diagnosis.value;
        if (diagnosisName.length > 0)
            medicalDiagnoses.push(diagnosisName);
    });
    let histories_medicalPsychiatricDiagnosisAges = document.querySelectorAll('.medicalDiagnosisAge');
    let medicalDiagnosisAges = [];
    histories_medicalPsychiatricDiagnosisAges.forEach(function (age) {
        let diagnosisAge = age.value;
        if (diagnosisAge.length > 0)
            medicalDiagnosisAges.push(diagnosisAge);
    });
    let histories_medicalPsychiatricDiagnosisDescriptions = document.querySelectorAll('.medicalDiagnosisDesc');
    let medicalDiagnosisDescriptions = [];
    histories_medicalPsychiatricDiagnosisDescriptions.forEach(function (description) {
        let diagnosisDescription = description.value;
        if (diagnosisDescription.length > 0)
            medicalDiagnosisDescriptions.push(diagnosisDescription);
    });


    let summary_healthDevelopment = document.getElementById('summary_healthDevelopment');
    let summary_medicalPsychiatricDiagnosis = document.getElementById('summary_medicalPsychiatricDiagnosis');
    let summary_historyAccidents = document.getElementById('summary_historyAccidents');
    let summary_hearingVision = document.getElementById('summary_hearingVision');


    let summary_healthDevelopment_description = document.getElementById('summary_healthDevelopment_description');
    if (!summary_healthDevelopment_description.getAttribute('data-dirty')) {
        summary_healthDevelopment.style.display = 'none';
        summary_healthDevelopment_description.style.display = 'none';

        let healthSummary = "";
        if (!customPronouns && age.length > 0 && FirstName.length > 0 && occupationPerson1.length > 0) {
            healthSummary = `${FirstName} is a ${age} year old ${gender == "Female" ? "girl" : "boy"} who lives with ${possessivePronoun} ${familyMembersString}. ${FirstName} 's ${occupationPerson1} works as a ${occupation1} and ${occupationPerson2} is a ${occupation2}.`;
            console.log("REST OF HEALTH SUMMARY");

        } else {
            console.log("Copy and paste but remove pronouns");

        }
        summary_healthDevelopment_description.value = healthSummary;
        if (healthSummary.length > 0) {
            summary_healthDevelopment.style.display = 'block';
            summary_healthDevelopment_description.style.display = 'block';
        }
    }

    let summary_medicalPsychiatricDiagnosis_description = document.getElementById('summary_medicalPsychiatricDiagnosis_description');

    let records_medicalHistoryMoreInformation = document.getElementById('records_medicalHistoryMoreInformation');
    if (!summary_medicalPsychiatricDiagnosis_description.getAttribute('data-dirty')) {
        summary_medicalPsychiatricDiagnosis.style.display = 'none';
        summary_medicalPsychiatricDiagnosis_description.style.display = 'none';
        let medicalHistoryMoreInformation = '';
        if (records_medicalHistoryMoreInformation.value.trim().length > 0) {
            medicalHistoryMoreInformation = records_medicalHistoryMoreInformation.value.trim() + ' ';
        }


        for (let i = 0; i < medicalDiagnoses.length; i++) {
            let diagnosis = medicalDiagnoses[i] ?? '';
            let age = medicalDiagnosisAges[i] ?? '';
            let description = medicalDiagnosisDescriptions[i] ?? '';
            if (diagnosis.length > 0 && age.length > 0 && description.length > 0) {
                medicalHistoryMoreInformation += `${FirstName} was diagnosed with ${diagnosis} at the age of ${age}. ${description} `;
            } else if (diagnosis.length > 0 && age.length > 0) {
                medicalHistoryMoreInformation += `${FirstName} was diagnosed with ${diagnosis} at the age of ${age}. `;
            } else if (diagnosis.length > 0 && description.length > 0) {
                medicalHistoryMoreInformation += `${FirstName} was diagnosed with ${diagnosis}. ${description} `;
            }
        }


        summary_medicalPsychiatricDiagnosis_description.value = medicalHistoryMoreInformation;
        if (medicalHistoryMoreInformation.length > 0) {
            summary_medicalPsychiatricDiagnosis.style.display = 'block';
            summary_medicalPsychiatricDiagnosis_description.style.display = 'block';
        }
    }

    let summary_historyAccidents_description = document.getElementById('summary_historyAccidents_description');
    if (!summary_historyAccidents_description.getAttribute('data-dirty')) {
        summary_historyAccidents.style.display = 'none';
        summary_historyAccidents_description.style.display = 'none';
        let historyAccidentsMoreInformation = '';
        let records_historyAccidents = document.getElementById('histories_accidentsMoreInformation');
        if (records_historyAccidents.value.trim().length > 0) {
            historyAccidentsMoreInformation = records_historyAccidents.value.trim();
            console.log(historyAccidentsMoreInformation);
        }
        summary_historyAccidents_description.value = historyAccidentsMoreInformation;
        if (historyAccidentsMoreInformation.length > 0) {
            summary_historyAccidents.style.display = 'block';
            summary_historyAccidents_description.style.display = 'block';
        }
    }

    let summary_hearingVision_description = document.getElementById('summary_hearingVision_description');
    if (!summary_hearingVision_description.getAttribute('data-dirty')) {
        summary_hearingVision.style.display = 'none';
        summary_hearingVision_description.style.display = 'none';
        let hearingVisionMoreInformation = '';


        let hearingVisionTableVision = document.querySelector('.hearingVisionTableVision');
        let hearingVisionTableHearing = document.querySelector('.hearingVisionTableHearing');
        let hearingVisionTableCustom = document.querySelectorAll('.hearingVisionTableCustom');

        let visionTestResult = hearingVisionTableVision.querySelector('.mdc-text-field__input').value.trim().toLowerCase();
        let visionTestDate = hearingVisionTableVision.querySelector('.mdc-text-field__input[type="date"]').value;
        let visionTestDateFormatted = new Date(visionTestDate).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'});
        let visionTestDescription = hearingVisionTableVision.querySelectorAll('.mdc-text-field__input')[2].value;

        let hearingTestResult = hearingVisionTableHearing.querySelector('.mdc-text-field__input').value.trim().toLowerCase();
        let hearingTestDate = hearingVisionTableHearing.querySelector('.mdc-text-field__input[type="date"]').value;
        let hearingTestDateFormatted = new Date(hearingTestDate).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'});
        let hearingTestDescription = hearingVisionTableHearing.querySelectorAll('.mdc-text-field__input')[2].value;

        let customTestResults = [];

        hearingVisionTableCustom.forEach(function (customTest) {
            let customTestName = customTest.querySelectorAll('.mdc-text-field__input')[0].value;
            let customTestResult = customTest.querySelectorAll('.mdc-text-field__input')[1].value;
            let customTestDate = customTest.querySelector('.mdc-text-field__input[type="date"]').value;
            let customTestDateFormatted = new Date(customTestDate).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'});
            if (customTestDateFormatted === 'Invalid Date') {
                customTestDateFormatted = '';
            }
            let customTestDescription = customTest.querySelectorAll('.mdc-text-field__input')[3].value;
            console.log(customTestName, customTestResult, customTestDate, customTestDescription);
            customTestResults.push({
                name: customTestName,
                result: customTestResult,
                date: customTestDateFormatted,
                description: customTestDescription
            });
        });
        if (visionTestResult.length > 0 && visionTestDate.length > 0) {
            hearingVisionMoreInformation += `${FirstName} had a vision test on ${visionTestDateFormatted} and the results were ${visionTestResult}. `;
        }
        else if (visionTestResult.length > 0) {
            hearingVisionMoreInformation += `${FirstName} had a vision test and the results were ${visionTestResult}. `;
        }
        if (visionTestDescription.length > 0) {
            hearingVisionMoreInformation += `${visionTestDescription} `;
        }

        if (hearingTestResult.length > 0 && hearingTestDate.length > 0) {
            hearingVisionMoreInformation += `${FirstName} had a hearing test on ${hearingTestDateFormatted} and the results were ${hearingTestResult}. `;
        }
        else if (hearingTestResult.length > 0) {
            hearingVisionMoreInformation += `${FirstName} had a hearing test and the results were ${hearingTestResult}. `;
        }
        if (hearingTestDescription.length > 0) {
            hearingVisionMoreInformation += `${hearingTestDescription} `;
        }

        customTestResults.forEach(function (customTestResult) {
            console.log(customTestResult);
            if (customTestResult.result.length > 0 && customTestResult.date.length > 0) {
                hearingVisionMoreInformation += `${FirstName} had a ${customTestResult.name} on ${customTestResult.date} and the results were ${customTestResult.result}. `;
            }
            else if (customTestResult.result.length > 0) {
                hearingVisionMoreInformation += `${FirstName} had a ${customTestResult.name} and the results were ${customTestResult.result}. `;
            }
            if (customTestResult.description.length > 0) {
                hearingVisionMoreInformation += `${customTestResult.description} `;
            }
        });

        summary_hearingVision_description.value = hearingVisionMoreInformation;

        if (hearingVisionMoreInformation.length > 0) {
            summary_hearingVision.style.display = 'block';
            summary_hearingVision_description.style.display = 'block';
        }
    }


    let histories_testPerformanceHistoryPreInformation = document.getElementById('histories_testPerformanceHistoryPreInformation');
    if (!histories_testPerformanceHistoryPreInformation.getAttribute('data-dirty')) {
        histories_testPerformanceHistoryPreInformation.value = `Based on available records, ${FirstName} took the English Language Arts assessment which establishes a baseline of learning progress. ${FirstName} also took the California Standardized Testing and Reporting (STAR) and the Smarter Balanced Assessment Consortium (SBAC). The STAR is based upon a five rating criteria: Far Below Basic, Below Basic, Basic, Proficient, and Advanced. The SBAC is based upon a four rating criteria: Standard Exceeded, Standard Met, Standard Nearly Met and Standard Not Met. Please refer to the following charts for ${FirstName}’s scores.`;
    }

    histories_subjectStandardMetTable_body = document.getElementById('histories_subjectStandardMetTable_body');
    if (histories_subjectStandardMetTable_body.innerHTML == '') {
        for (let i = topGradeLevel; i >= 1; i--) {
            let gradeLevel = gradeLevelTable[i];
            let row = document.createElement('tr');
            row.class = 'mdc-data-table__row';
            row.innerHTML = getSubjectStandardMetRow(gradeLevel);
            histories_subjectStandardMetTable_body.appendChild(row);
            row.querySelectorAll('.mdc-text-field').forEach(function (textField) {
                mdc.textField.MDCTextField.attachTo(textField);
            });
        }
    }

    let histories_attendanceHistory_body = document.getElementById('histories_attendanceHistory_body');
    if (histories_attendanceHistory_body.innerHTML == '') {
        for (let i = topGradeLevel; i >= 1; i--) {
            let gradeLevel = gradeLevelTable[i];
            let row = document.createElement('tr');
            row.class = 'mdc-data-table__row';
            row.innerHTML = getAttendanceHistoryRow(gradeLevel);
            histories_attendanceHistory_body.appendChild(row);
            row.querySelectorAll('.mdc-text-field').forEach(function (textField) {
                mdc.textField.MDCTextField.attachTo(textField);
            });
        }
    }


    let histories_cfsInvolvement_age_from = document.getElementById('histories_cfsInvolvement_age_from');
    let histories_cfsInvolvement_age_to = document.getElementById('histories_cfsInvolvement_age_to');
    let histories_cfsInvolvement_description = document.getElementById('histories_cfsInvolvement_description');
    let histories_cfsInvolvementMoreInformation = document.getElementById('histories_cfsInvolvementMoreInformation');
    if (histories_cfsInvolvementMoreInformation.getAttribute('data-dirty') != 'true') {
        let cfsInvolvementMoreInformation = '';
        if (histories_cfsInvolvement_age_from.value.trim().length > 0 && histories_cfsInvolvement_age_to.value.trim().length > 0) {
            cfsInvolvementMoreInformation += `${FirstName} was involved with the Department of Children and Family Services (DCFS) from the ages of ${histories_cfsInvolvement_age_from.value} to ${histories_cfsInvolvement_age_to.value}. `;
        } else if (histories_cfsInvolvement_age_from.value.trim().length > 0) {
            cfsInvolvementMoreInformation += `${FirstName} was involved with the Department of Children and Family Services (DCFS) from the age of ${histories_cfsInvolvement_age_from.value}. `;
        }
        if (histories_cfsInvolvement_description.value.trim().length > 0) {
            cfsInvolvementMoreInformation += `${histories_cfsInvolvement_description.value} `;
        }
        if (cfsInvolvementMoreInformation.length == '') {
            cfsInvolvementMoreInformation = 'There has been no reported history of child protective services involvement';
        }
        histories_cfsInvolvementMoreInformation.value = cfsInvolvementMoreInformation;
    }



    clinicalInterviews_response1 = document.getElementById('clinicalInterviews_response1');
    clinicalInterviews_response2 = document.getElementById('clinicalInterviews_response2');
    clinicalInterviews_response3 = document.getElementById('clinicalInterviews_response3');
    clinicalInterviews_response4 = document.getElementById('clinicalInterviews_response4');
    clinicalInterviews_response5 = document.getElementById('clinicalInterviews_response5');
    clinicalInterviews_response6 = document.getElementById('clinicalInterviews_response6');
    clinicalInterviews_response7 = document.getElementById('clinicalInterviews_response7');
    clinicalInterviews_response8 = document.getElementById('clinicalInterviews_response8');
    clinicalInterviews_response9 = document.getElementById('clinicalInterviews_response9');
    clinicalInterviews_response10 = document.getElementById('clinicalInterviews_response10');
    clinicalInterviews_response1.textContent = `${FirstName} stated that ${subjectPronoun} lives with ${possessivePronoun}`;
    clinicalInterviews_response2.textContent = `${possessivePronounCapped} interests include`;
    clinicalInterviews_response3.textContent = `${FirstName}'s favorite subject or part about school is`;
    clinicalInterviews_response4.textContent = `${possessivePronounCapped} least favorite part about school is`;

    clinicalInterviews_response6.textContent = `For strengths, ${subjectPronoun} reported`;
    clinicalInterviews_response7.textContent = `${FirstName} stated that ${subjectPronoun} would like to improve in`;
    clinicalInterviews_response8.textContent = `When ${subjectPronoun} grows up, ${FirstName} would like to`;
    clinicalInterviews_response10.innerHTML = `The examiner asked ${FirstName} what ${subjectPronoun} would wish for if ${subjectPronoun} had 3 wishes.<br/>${subjectPronounCapped} stated ${subjectPronoun} would wish for`;
    


    let parentName1 = document.getElementById('clinicalInterviews_parentName1').value ?? '';
    let parentName2 = document.getElementById('clinicalInterviews_parentName2')?.value ?? '';
    let parentsString = parentName1.length > 0 ? parentName2.length > 0 ? `${parentName1} and ${parentName2}` : parentName1 : parentName2;
    let clinicalInterviewsParent_response1 = document.getElementById('clinicalInterviewsParent_response1');
    let clinicalInterviewsParent_response2 = document.getElementById('clinicalInterviewsParent_response2');
    let clinicalInterviewsParent_response3 = document.getElementById('clinicalInterviewsParent_response3');
    let clinicalInterviewsParent_response4 = document.getElementById('clinicalInterviewsParent_response4');
    let clinicalInterviewsParent_response5 = document.getElementById('clinicalInterviewsParent_response5');
    let clinicalInterviewsParent_response6 = document.getElementById('clinicalInterviewsParent_response6');
    let clinicalInterviewsParent_response7 = document.getElementById('clinicalInterviewsParent_response7');
    let clinicalInterviewsParent_response8 = document.getElementById('clinicalInterviewsParent_response8');
    let clinicalInterviewsParent_response9 = document.getElementById('clinicalInterviewsParent_response9');
    let clinicalInterviewsParent_response10 = document.getElementById('clinicalInterviewsParent_response10');
    let clinicalInterviewsParent_response11 = document.getElementById('clinicalInterviewsParent_response11');
    let clinicalInterviewsParent_response12 = document.getElementById('clinicalInterviewsParent_response12');
    let clinicalInterviewsParent_response13 = document.getElementById('clinicalInterviewsParent_response13');
    clinicalInterviewsParent_response1.textContent = `When discussing change or grief experience in the home situation, ${parentsString} reported`;
    clinicalInterviewsParent_response2.textContent = `${FirstName}'s peer interactions were described as`;
    clinicalInterviewsParent_response3.textContent = `${parentsString} stated that ${FirstName}'s emotional state is`;
    clinicalInterviewsParent_response4.textContent = `When asked about ${FirstName}'s progress in school, ${parentsString} shared`;
    clinicalInterviewsParent_response5.textContent = `In terms of outside evaluations, ${parentsString} noted`;
    clinicalInterviewsParent_response6.textContent = `${parentsString} reported that ${FirstName} has difficulty with`;
    clinicalInterviewsParent_response7.textContent = `When asked if ${FirstName} has experienced trauma, ${parentsString} indicated`;
    clinicalInterviewsParent_response8.textContent = `${FirstName}'s sleeping and eating have been`;
    clinicalInterviewsParent_response9.textContent = `${parentsString} shared that ${FirstName} has been diagnosed with`;
    clinicalInterviewsParent_response10.textContent = `${parentsString} reported that ${FirstName} is taking`;
    clinicalInterviewsParent_response11.textContent = `When asked if ${FirstName} has had injuries or hospitalizations, ${parentsString} reported`;

    clinicalInterviewsParent_response13.textContent = `For strengths, ${parentsString} stated`;


    let classroomObservationTable_question1 = document.getElementById('classroomObservationTable_question1');
    let classroomObservationTable_question2 = document.getElementById('classroomObservationTable_question2');
    let classroomObservationTable_question3 = document.getElementById('classroomObservationTable_question3');
    classroomObservationTable_question1.textContent = `${FirstName} was observed by`;

    classroomObservationTable_question3.textContent = `${subjectPronounCapped} was observed during`;

    let classroomObservationTable_personalize1 = document.getElementById('classroomObservationTable_personalize1');
    let classroomObservationTable_personalize2 = document.getElementById('classroomObservationTable_personalize2');
    let classroomObservationTable_personalize3 = document.getElementById('classroomObservationTable_personalize3');
    let classroomObservationTable_personalize4 = document.getElementById('classroomObservationTable_personalize4');
    let classroomObservationTable_personalize5 = document.getElementById('classroomObservationTable_personalize5');
    let classroomObservationTable_personalize6 = document.getElementById('classroomObservationTable_personalize6');
    let classroomObservationTable_personalize7 = document.getElementById('classroomObservationTable_personalize7');
    let classroomObservationTable_personalize8 = document.getElementById('classroomObservationTable_personalize8');
    let classroomObservationTable_personalize9 = document.getElementById('classroomObservationTable_personalize9');
    let classroomObservationTable_personalize10 = document.getElementById('classroomObservationTable_personalize10');
    let classroomObservationTable_personalize11 = document.getElementById('classroomObservationTable_personalize11');
    let classroomObservationTable_personalize12 = document.getElementById('classroomObservationTable_personalize12');
    let classroomObservationTable_personalize13 = document.getElementById('classroomObservationTable_personalize13');
    let classroomObservationTable_personalize14 = document.getElementById('classroomObservationTable_personalize14');
    let classroomObservationTable_personalize15 = document.getElementById('classroomObservationTable_personalize15');
    let classroomObservationTable_personalize16 = document.getElementById('classroomObservationTable_personalize16');
    let classroomObservationTable_personalize17 = document.getElementById('classroomObservationTable_personalize17');
    classroomObservationTable_personalize1.textContent = `${FirstName}`;
    classroomObservationTable_personalize2.textContent = `${subjectPronounCapped}`;
    classroomObservationTable_personalize3.textContent = `During the observation, ${subjectPronoun}`;
    classroomObservationTable_personalize4.textContent = `When given correction by the teacher, ${subjectPronoun}`;
    classroomObservationTable_personalize5.textContent = `${subjectPronounCapped}`;
    classroomObservationTable_personalize6.textContent = `${subjectPronounCapped}`;
    classroomObservationTable_personalize7.textContent = `${FirstName}`;
    classroomObservationTable_personalize8.textContent = `${FirstName}`;
    classroomObservationTable_personalize9.textContent = `When working independently, ${FirstName}`;
    classroomObservationTable_personalize10.textContent = `When working with peers, ${subjectPronoun}`;
    classroomObservationTable_personalize11.textContent = `${FirstName}`;
    classroomObservationTable_personalize12.textContent = `${FirstName}`;
    classroomObservationTable_personalize13.textContent = `${FirstName}`;
    classroomObservationTable_personalize14.textContent = `${subjectPronounCapped}`;
    classroomObservationTable_personalize15.textContent = `${FirstName}`;
    classroomObservationTable_personalize16.textContent = `${FirstName}`;
    classroomObservationTable_personalize17.textContent = `${FirstName}`;

    let lunchtimeObservationsTable_location = document.getElementById('lunchtimeObservationsTable_location');
    lunchtimeObservationsTable_location.textContent = `The examiner observed ${FirstName}`;


    let wiscDescription = document.getElementById('wiscDescription');
    wiscDescription.textContent = `${FirstName} was administered the Wechsler Intelligence Scale for Children-Fifth Edition (WISC-V). The WISC-V is an individually administered, comprehensive clinical instrument for assessing the intelligence of children aged 6 years 0 months through 16 years 11 months. The WISC-V provides subtest and composite scores that represent intellectual functioning in specific cognitive domains, as well as a composite score that represents general intellectual ability. The five Composite areas are Verbal Comprehension, Visual Spatial, Fluid Reasoning, Working Memory and Processing Speed.`;
    let wiscTableLabel = document.getElementById('wiscTableLabel');
    wiscTableLabel.textContent = `${FirstName}'s WISC-V scores are presented below. Subtests used to calculate the FSIQ are bolded.`;
};




function updateWiscTable() {
    let wisc_chart_composite_score1 = document.getElementById('wisc_chart_composite_score1');
    let wisc_chart_composite_score2 = document.getElementById('wisc_chart_composite_score2');
    let wisc_chart_composite_score3 = document.getElementById('wisc_chart_composite_score3');
    let wisc_chart_composite_score4 = document.getElementById('wisc_chart_composite_score4');
    let wisc_chart_composite_score5 = document.getElementById('wisc_chart_composite_score5');
    let wisc_chart_composite_score6 = document.getElementById('wisc_chart_composite_score6');

    const data = [
        {type: "Verbal Comp.", score: wisc_chart_composite_score1.value},
        {type: "Visual Spatial", score: wisc_chart_composite_score2.value},
        {type: "Fluid Reasoning", score: wisc_chart_composite_score3.value},
        {type: "Working Memory", score: wisc_chart_composite_score4.value},
        {type: "Processing Speed", score: wisc_chart_composite_score5.value},
        {type: "Cognitive Ability", score: wisc_chart_composite_score6.value}
    ];


    let ctx = document.getElementById('wisc-chart').getContext('2d');
    try {
        WiscChart.destroy();
    } catch (e) {
        console.log(e);
    }
    WiscChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(row => row.type),
            datasets: [{
                label: 'Scores',
                data: data.map(row => row.score),
                backgroundColor: ['rgba(75, 192, 192, 0.2)'],
                borderColor: ['rgba(75, 192, 192, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 85,
                            yMax: 85,
                            borderColor: 'red',
                            borderWidth: 2,
                            label: {
                                content: 'Reference Line',
                                enabled: true,
                                position: 'end'
                            }
                        }
                    }
                }
            }
        }
    });

    let wisc_chart_description_1 = document.getElementById('wisc-chart_description_1');
    let wisc_chart_description_2 = document.getElementById('wisc-chart_description_2');
    let wisc_chart_description_3 = document.getElementById('wisc-chart_description_3');
    let wisc_chart_description_4 = document.getElementById('wisc-chart_description_4');
    let wisc_chart_description_5 = document.getElementById('wisc-chart_description_5');
    let wisc_chart_description_6 = document.getElementById('wisc-chart_description_6');
    function getCompositeValue(input) {
        if (input >= 130) return "Extremely High";
        if (input >= 120) return "Very High";
        if (input >= 110) return "High Average";
        if (input >= 90) return "Average";
        if (input >= 80) return "Low Average";
        if (input >= 70) return "Very Low";
        if (input >= 1) return "Extremely Low";
        if (input == 0) return "";
    }

    wisc_chart_description_1.textContent = `${getCompositeValue(wisc_chart_composite_score1.value)}`;
    wisc_chart_description_2.textContent = `${getCompositeValue(wisc_chart_composite_score2.value)}`;
    wisc_chart_description_3.textContent = `${getCompositeValue(wisc_chart_composite_score3.value)}`;
    wisc_chart_description_4.textContent = `${getCompositeValue(wisc_chart_composite_score4.value)}`;
    wisc_chart_description_5.textContent = `${getCompositeValue(wisc_chart_composite_score5.value)}`;
    wisc_chart_description_6.textContent = `${getCompositeValue(wisc_chart_composite_score6.value)}`;

    let wisc_chart_percentile1 = document.getElementById('wisc-chart_percentile_1');
    let wisc_chart_percentile2 = document.getElementById('wisc-chart_percentile_2');
    let wisc_chart_percentile3 = document.getElementById('wisc-chart_percentile_3');
    let wisc_chart_percentile4 = document.getElementById('wisc-chart_percentile_4');
    let wisc_chart_percentile5 = document.getElementById('wisc-chart_percentile_5');
    let wisc_chart_percentile6 = document.getElementById('wisc-chart_percentile_6');

    function getPercentile(input) {
        if (input >= 149) return ">99.9";
        if (input >= 145) return "99.9";
        if (input >= 143) return "99.8";
        if (input >= 141) return "99.7";
        if (input == 140) return "99.6";
        if (input >= 139) return "99.5";
        if (input >= 133) return "99";
        if (input >= 130) return "98";
        if (input >= 128) return "97";
        if (input >= 126) return "96";
        if (input >= 124) return "95";
        if (input == 123) return "94";
        if (input >= 122) return "93";
        if (input >= 121) return "92";
        if (input >= 120) return "91";
        if (input >= 119) return "90";
        if (input >= 118) return "88";
        if (input >= 117) return "87";
        if (input >= 116) return "86";
        if (input >= 115) return "84";
        if (input >= 114) return "82";
        if (input >= 113) return "81";
        if (input >= 112) return "79";
        if (input >= 111) return "77";
        if (input >= 110) return "75";
        if (input >= 109) return "73";
        if (input >= 108) return "70";
        if (input >= 107) return "68";
        if (input >= 106) return "66";
        if (input >= 105) return "63";
        if (input >= 104) return "61";
        if (input >= 103) return "58";
        if (input >= 102) return "55";
        if (input >= 101) return "53";
        if (input >= 100) return "50";
        if (input >= 99) return "47";
        if (input >= 98) return "45";
        if (input >= 97) return "42";
        if (input >= 96) return "40";
        if (input >= 95) return "37";
        if (input >= 94) return "34";
        if (input >= 93) return "32";
        if (input >= 92) return "30";
        if (input >= 91) return "27";
        if (input >= 90) return "25";
        if (input >= 89) return "23";
        if (input >= 88) return "21";
        if (input >= 87) return "19";
        if (input >= 86) return "18";
        if (input >= 85) return "16";
        if (input >= 84) return "14";
        if (input >= 83) return "13";
        if (input >= 82) return "12";
        if (input >= 81) return "10";
        if (input >= 80) return "9";
        if (input >= 79) return "8";
        if (input >= 78) return "7";
        if (input >= 77) return "6";
        if (input >= 75) return "5";
        if (input >= 73) return "4";
        if (input >= 71) return "3";
        if (input >= 68) return "2";
        if (input >= 62) return "1";
        if (input >= 61) return "0.5";
        if (input >= 60) return "0.4";
        if (input >= 59) return "0.3";
        if (input >= 58) return "0.2";
        if (input >= 51) return "0.1";
        if (input >= 1) return "<0.1";
        if (input == 0) return "";
    }

    wisc_chart_percentile1.textContent = `${getPercentile(wisc_chart_composite_score1.value)}`;
    wisc_chart_percentile2.textContent = `${getPercentile(wisc_chart_composite_score2.value)}`;
    wisc_chart_percentile3.textContent = `${getPercentile(wisc_chart_composite_score3.value)}`;
    wisc_chart_percentile4.textContent = `${getPercentile(wisc_chart_composite_score4.value)}`;
    wisc_chart_percentile5.textContent = `${getPercentile(wisc_chart_composite_score5.value)}`;
    wisc_chart_percentile6.textContent = `${getPercentile(wisc_chart_composite_score6.value)}`;

    let wisc_table_analysis = document.getElementById('wisc-table-analysis');
    let overallScore = wisc_chart_composite_score6.value;
    let overallPercentile = getPercentile(overallScore);
    wisc_table_analysis.textContent = `Overall, ${FirstName}'s FSIQ (Full Scale) Score is within the ${getCompositeValue(overallScore)} range when compared to other children ${possessivePronoun} age (FSIQ=${overallScore}, %ile=${overallPercentile}).`;
}




async function generateDocument() {
    let reportTitle = document.getElementById('reportTitle').value
    let description = document.getElementById('description').value;
    let reportDate = document.getElementById('reportDate').value;

    let documentDbDetails = [
        {
            "id": "name",
            "vanity": "Name",
            "value": document.getElementById('firstName').value + " " + document.getElementById('lastName').value,
            "type": "field",
            "sortOrder": document.getElementById('name').getAttribute('data-sort-order'),
            "break": false
        },
        
        {
            "id": "grade",
            "vanity": "Grade",
            "value": document.getElementById('grade').querySelector('.mdc-select__selected-text').textContent,
            "type": "field",
            "sortOrder": document.getElementById('grade').getAttribute('data-sort-order'),
            "break": false
        },
        {
            "id": "birthDate",
            "vanity": "Date of Birth",
            "value": document.getElementById('birthDate').value,
            "type": "field",
            "sortOrder": document.getElementById('birth_date').getAttribute('data-sort-order'),
            "break": false
        },
        {
            "id": "placement",
            "vanity": "Placement",
            "value": document.getElementById('placement').querySelector('.mdc-select__selected-text').textContent,
            "type": "field",
            "sortOrder": document.getElementById('placement').getAttribute('data-sort-order'),
            "break": false
        },
        {
            "id": "studentId",
            "vanity": "Student ID",
            "value": document.getElementById('studentId').value,
            "type": "field",
            "sortOrder": document.getElementById('student_id').getAttribute('data-sort-order'),
            "break": false
        },
        {
            "id": "examiners",
            "vanity": "Examiners",
            "value": document.getElementById('examinersInput').value,
            "type": "field",
            "sortOrder": document.getElementById('examiners').getAttribute('data-sort-order'),
            "break": true
        },
        {
            "id": "chronologicalAge",
            "vanity": "Chronological Age",
            "value": document.getElementById('age-label').textContent,
            "type": "field",
            "sortOrder": document.getElementById('age').getAttribute('data-sort-order'),
            "break": false
        },
        {
            "id": "gender",
            "vanity": "Gender",
            "value": document.getElementById('gender').querySelector('.mdc-select__selected-text').textContent,
            "type": "field",
            "sortOrder": document.getElementById('gender').getAttribute('data-sort-order'),
            "break": false
        },
        {
            "id": "ethnicity",
            "vanity": "Ethnicity",
            "value": document.getElementById('ethnicity').querySelector('.mdc-select__selected-text').textContent,
            "type": "field",
            "sortOrder": document.getElementById('ethnicity').getAttribute('data-sort-order'),
            "break": false
        },
        {
            "id": "homeLanguage",
            "vanity": "Home Language",
            "value": document.getElementById('home_language').querySelector('.mdc-select__selected-text').textContent,
            "type": "field",
            "sortOrder": document.getElementById('home_language').getAttribute('data-sort-order'),
            "break": false
        },
        {
            "id": "languageClassification",
            "vanity": "Language Classification",
            "value": document.getElementById('language_classification').querySelector('.mdc-select__selected-text').textContent,
            "type": "field",
            "sortOrder": document.getElementById('language_classification').getAttribute('data-sort-order'),
            "break": false
        },
        {
            "id": "languageInstruction",
            "vanity": "Language Instruction",
            "value": document.getElementById('language_instruction').querySelector('.mdc-select__selected-text').textContent,
            "type": "field",
            "sortOrder": document.getElementById('language_instruction').getAttribute('data-sort-order'),
            "break": false
        },
        {
            "id": "attendingSchool",
            "vanity": "Attending School",
            "value": document.getElementById('attendingSchool').value,
            "type": "field",
            "sortOrder": document.getElementById('attending_school').getAttribute('data-sort-order'),
            "break": false
        },
        {
            "id": "reportDate",
            "vanity": "Date",
            "value": reportDate,
            "type": "field",
            "sortOrder": document.getElementById('report_date').getAttribute('data-sort-order'),
            "break": false
        }
    ];

    let pronounsField = document.getElementById('pronounsInput');
    if (pronounsField) {
        documentDbDetails.push({
            "id": "pronouns",
            "vanity": "Pronouns",
            "value": pronounsField.value,
            "type": "field",
            "sortOrder": document.getElementById('pronouns').getAttribute('data-sort-order')
        });
    } else {

        documentDbDetails.push({
            "id": "pronouns",
            "vanity": "",
            "value": "",
            "type": "spacer",
            "sortOrder": document.getElementById('pronouns').getAttribute('data-sort-order')
        });
    }

    let spacers = document.querySelectorAll('.report-spacer');
    spacers.forEach((spacer) => {
        documentDbDetails.push({
            "id": spacer.id,
            "vanity": "",
            "value": "",
            "type": "spacer",
            "sortOrder": spacer.getAttribute('data-sort-order')
        });
    });


    var logoSection = null;
    let customLogo = document.getElementById('customUserLogo');
    if (customLogo && customLogo.src) {
        

        if (document.getElementById('customUserLogo').src) {




            const imageUrl = document.getElementById('customUserLogo').src;
            const base64String = await toBase64FromUrl(imageUrl);
            let imgWidth = document.getElementById('customUserLogo').getAttribute('data-width');
            let imgHeight = document.getElementById('customUserLogo').getAttribute('data-height');
            console.log(base64String);
            logoSection = new docx.Paragraph({
                children: [
                    new docx.ImageRun({
                        data: base64String,
                        transformation: {
                            width: imgWidth,
                            height: imgHeight,
                        },
                    }),
                ],
                thematicBreak: true,
            });

            console.log("Generated logo section");
        }
    }


    var schoolInformationSection = null;
    let schoolInfoName = document.getElementById('schoolInformationName').value;
    let schoolInfoAddress = document.getElementById('schoolInformationAddress').value;

    let schoolInfoAddressLines = schoolInfoAddress.split('\n');
    let schoolInfoAddressTextRuns = [];
    schoolInfoAddressLines.forEach((line) => {
        schoolInfoAddressTextRuns.push(new docx.TextRun({
            text: line,
            font: "Arial",
            size: 20,
            break: 1
        }));
    });
    if (schoolInfoName.length > 0) {

        
        schoolInformationSection = new docx.Table({
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE,
            },
            rows: [
                new docx.TableRow({
                    children: [


                        new docx.TableCell({
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: "",
                                            font: "Arial",
                                            size: 20,
                                        }),
                                    ],
                                }),
                            ],
                            width: {
                                size: 30,
                                type: docx.WidthType.PERCENTAGE,
                            },
                        }),

                        new docx.TableCell({
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: "",
                                            font: "Arial",
                                            size: 20,
                                        }),
                                    ],
                                }),
                            ],
                            width: {
                                size: 30,
                                type: docx.WidthType.PERCENTAGE,
                            },
                        }),
                        new docx.TableCell({
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: schoolInfoName,
                                            font: "Arial",
                                            size: 20,
                                            bold: false
                                        }),
                                        ...schoolInfoAddressTextRuns,
                                    ],
                                    alignment: docx.AlignmentType.LEFT,
                                }),
                            ],
                            width: {
                                size: 40,
                                type: docx.WidthType.PERCENTAGE,
                            },
                        }),
                    ],
                })
            ],
            borders: {
                top: {style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF"},
                bottom: {style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF"},
                left: {style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF"},
                right: {style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF"},
                insideHorizontal: {style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF"},
                insideVertical: {style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF"},
            },
        });

        console.log("Create school info section");
    }

    console.log(documentDbDetails);


    const titleSection = new docx.Paragraph({
        children: [
            new docx.TextRun({
                text: reportTitle,
                bold: true,
                size: 25,
                font: "Calibri",
                underline: docx.UnderlineType.SINGLE,
            }),
            new docx.TextRun({
                text: "",
                break: 1
            }),
            new docx.TextRun({
                text: description,
                bold: false,
                size: 25,
                font: "Calibri"
            }),
            new docx.TextRun({
                text: "",
                break: 1
            }),
            
        ],
        alignment: docx.AlignmentType.CENTER,
    });

    
    const pageBreak = new docx.Paragraph({
        children: [
            new docx.TextRun({
                text: "",
                children: [new docx.PageBreak()],
            }),
        ],
    });

    const pageLine = new docx.Paragraph({
        children: [
            new docx.TextRun({
                text: "",
            }),
        ],
        thematicBreak: true,
    });
    const createRightAlignedCell = (text, textValue, breakBeforeValue) => {
        return new docx.TableCell({
            children: [
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: text,
                            font: "Arial",
                            size: 20,
                            underline: docx.UnderlineType.SINGLE,
                        }),
                        new docx.TextRun({
                            text: "",
                            break: breakBeforeValue ? 1 : 0,
                        }),
                        new docx.TextRun({
                            text: breakBeforeValue ? textValue : " " + textValue,
                            font: "Arial",
                            size: 20
                        }),
                        new docx.TextRun({
                            text: "",
                            break: 1,
                        }),
                    ],
                    alignment: docx.AlignmentType.LEFT,
                }),
            ],
            width: {
                size: 50,
                type: docx.WidthType.PERCENTAGE,
            },
        });
    };

    const createLeftAlignedCell = (text, textValue, breakBeforeValue) => {
        return new docx.TableCell({
            children: [
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: text,
                            font: "Arial",
                            size: 20,
                            underline: docx.UnderlineType.SINGLE,
                        }),
                        new docx.TextRun({
                            text: "",
                            break: breakBeforeValue ? 1 : 0,
                        }),
                        new docx.TextRun({
                            text: breakBeforeValue ? textValue : " " + textValue,
                            font: "Arial",
                            size: 20
                        }),
                        new docx.TextRun({
                            text: "",
                            break: 1,
                        }),
                    ],
                }),
            ],
            width: {
                size: 50,
                type: docx.WidthType.PERCENTAGE,
            },
        });
    };


    let tableRows = [];
    documentDbDetails.sort((a, b) => a.sortOrder - b.sortOrder);

    

    for (let i = 0; i < documentDbDetails.length; i += 2) {
        let leftCell = null;
        if (documentDbDetails[i].type == "spacer") {
            leftCell = createLeftAlignedCell("", "", false);
        } else {
            leftCell = createLeftAlignedCell(documentDbDetails[i].vanity + ":", documentDbDetails[i].value, documentDbDetails[i].break);
        }
        let rightCell = null;
        if (i + 1 < documentDbDetails.length) {
            if (documentDbDetails[i + 1].type == "spacer") {
                rightCell = createRightAlignedCell("", "", false);
            } else {
                rightCell = createRightAlignedCell(documentDbDetails[i + 1].vanity + ":", documentDbDetails[i + 1].value, documentDbDetails[i + 1].break);
            }
        } else {
            rightCell = createRightAlignedCell("", "", false);
        }

        let row = new docx.TableRow({
            children: [
                leftCell,
                rightCell,
            ],
        });
        tableRows.push(row);
    }


    const fullWidthTable = new docx.Table({
        width: {
            size: 100,
            type: docx.WidthType.PERCENTAGE,
        },
        rows: tableRows,
        borders: {
            top: {style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF"},
            bottom: {style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF"},
            left: {style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF"},
            right: {style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF"},
            insideHorizontal: {style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF"},
            insideVertical: {style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF"},
        },
    });


    var firstPage = [
        titleSection,
        fullWidthTable,
        pageLine
    ];


    if (logoSection) {
        firstPage.unshift(logoSection);
    }


    if (schoolInformationSection) {
        let schoolInformationSpacer = new docx.Paragraph({
            children: [new docx.TextRun({text: "", break: 4})],
        });
        firstPage.unshift(schoolInformationSpacer);
        firstPage.unshift(schoolInformationSection);
    }

    const doc = new docx.Document({
        creator: 'SimpleReports',

        title: reportTitle,
        description: description,
        sections: [
            {
                properties: {
                    type: docx.SectionType.CONTINUOUS,
                    page: {
                        margin: {
                            top: 900,
                            right: 1000,
                            bottom: 1000,
                            left: 1000,
                        },
                    }
                },
                children: [
                    ...firstPage,
                ],
            }
        ],

    });

    docx.Packer.toBlob(doc).then((blob) => {
        console.log(blob);
        saveAs(blob, "example.docx");
        console.log("Document created successfully");
    });
}

let titleElem = document.getElementById('reportTitle');
createEditableSelect(titleElem);


function setTextboxDirty(event) {
    event.target.setAttribute('data-dirty', 'true');
}

function changeGradeChoice() {
    let histories_subjectStandardMetTable_body = document.getElementById('histories_subjectStandardMetTable_body');
    histories_subjectStandardMetTable_body.innerHTML = '';
    let histories_attendanceHistory_body = document.getElementById('histories_attendanceHistory_body');
    histories_attendanceHistory_body.innerHTML = '';
}

function getConcernCheckboxElement(concern) {
    return `<div class="mdc-checkbox">
<input type="checkbox" class="mdc-checkbox__native-control" id="${concern}"
name="${concern}" />
<div class="mdc-checkbox__background">
<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24">
<path class="mdc-checkbox__checkmark-path" fill="none"
  d="M1.73,12.91 8.1,19.28 22.79,4.59">
</path>
</svg>
<div class="mdc-checkbox__mixedmark"></div>
</div>
<div class="mdc-checkbox__ripple"></div>
</div>
<label class="checkboxGridLabel" for="${concern}">${concern}</label>
<div class="deleteSectionButton" onclick="removeField(event, this.parentNode)">
<button type="button">X</button>
</div></div>`;
}

function addConcernCheckbox(concern) {
    if (concern) {
        let concernElem = document.createElement('div');
        concernElem.className = 'mdc-form-field checkboxGridField checkboxGridField4s';
        concernElem.innerHTML = getConcernCheckboxElement(concern);
        concernElem.querySelector('.checkboxGridLabel').textContent = concern;
        document.getElementById('areas_of_concern').insertBefore(concernElem, document.getElementById('areas_of_concern').lastChild);
    }
}

function getInterventionsElement(intervention) {
    return `
  <div class="mdc-checkbox">
  <input type="checkbox" class="mdc-checkbox__native-control" id="${intervention}"
  name=${intervention} class="mdc-checkbox__native-control">
  <div class="mdc-checkbox__background">
  <svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24">
  <path class="mdc-checkbox__checkmark-path" fill="none"
  d="M1.73,12.91 8.1,19.28 22.79,4.59"></path>
  </svg>
  <div class="mdc-checkbox__mixedmark"></div>
  </div>
  <div class="mdc-checkbox__ripple"></div>
  </div>
  <label for="${intervention}">${intervention}</label>
  </div>`;
}




function getEvaluationElement(evaluation) {
    return `<div class="mdc-form-field">
<div class="mdc-checkbox">
<input type="checkbox" class="mdc-checkbox__native-control" id="${evaluation}"
name="${evaluation}" class="mdc-checkbox__native-control">
<div class="mdc-checkbox__background">
<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24">
<path class="mdc-checkbox__checkmark-path" fill="none"
d="M1.73,12.91 8.1,19.28 22.79,4.59">
</path>
</svg>
<div class="mdc-checkbox__mixedmark"></div>
</div>
<div class="mdc-checkbox__ripple"></div>
</div>
<label for=${evaluation}>${evaluation}</label>
</div>
<div class="deleteSectionButton" onclick="removeField(event, this.parentNode)">
<button type="button">X</button>
</div>`;
}

function getProcedureElement(procedure) {
    return `<span class="mdc-list-item__ripple"></span>
<span class="mdc-list-item__text">${procedure}</span>
<div class="reportListDateColumn">
  <input id="${procedure}Date" class="mdc-text-field__input" type="date" placeholder="Enter year" aria-labelledby="number-floating-label">
</div>`;
}


function addPersonCellToLivingInHome(event, elem, parent) {

    elem.style.display = 'none';
    let personInput = document.createElement('div');
    personInput.classList.add('mdc-select', 'mdc-select--filled', 'w-100', 'records_PersonLivingInHome');
    personInput.innerHTML = `<span class="mdc-select__ripple"></span>
<div class="mdc-select__anchor">
<span class="mdc-select__selected-text"></span>
<span class="mdc-select__dropdown-icon">
<svg class="mdc-select__dropdown-icon-graphic"
viewBox="7 10 10 5">
<polygon class="mdc-select__dropdown-icon-inactive"
stroke="none" fill-rule="evenodd"
points="7 10 12 15 17 10">
</polygon>
<polygon class="mdc-select__dropdown-icon-active"
stroke="none" fill-rule="evenodd"
points="7 15 12 10 17 15">
</polygon>
</svg>
</span>
<span class="mdc-floating-label">Person</span>
<span class="mdc-line-ripple"></span>
</div>
<div class="mdc-select__menu mdc-menu mdc-menu-surface w-100">
<ul class="mdc-list">
<li class="mdc-list-item" data-value="A">
<span class="mdc-list-item__ripple"></span>
<span class="mdc-list-item__text">Mother</span>
</li>
<li class="mdc-list-item" data-value="A">
<span class="mdc-list-item__ripple"></span>
<span class="mdc-list-item__text">Father</span>
</li>
<li class="mdc-list-item" data-value="A">
<span class="mdc-list-item__ripple"></span>
<span class="mdc-list-item__text">Stepmom</span>
</li>
<li class="mdc-list-item" data-value="A">
<span class="mdc-list-item__ripple"></span>
<span class="mdc-list-item__text">Stepdad</span>
</li>
<li class="mdc-list-item" data-value="A">
<span class="mdc-list-item__ripple"></span>
<span class="mdc-list-item__text">Guardian</span>
</li>
<li class="mdc-list-item" data-value="A">
<span class="mdc-list-item__ripple"></span>
<span class="mdc-list-item__text">Legal
Guardian</span>
</li>
<li class="mdc-list-item" data-value="A">
<span class="mdc-list-item__ripple"></span>
<span class="mdc-list-item__text">Brother</span>
</li>
<li class="mdc-list-item" data-value="A">
<span class="mdc-list-item__ripple"></span>
<span class="mdc-list-item__text">Sister</span>
</li>
<div class="mdc-text-field mdc-text-field--filled mdc-text-field--no-label"
style="width: 100%;">
<input class="mdc-text-field__input" type="text"
aria-label="Label"
onkeydown="submitCustomSelect(event, this, this.parentNode.parentNode.parentNode.parentNode)"
placeholder="Custom">
</div>

</ul>
</div>`;
    parent.appendChild(personInput);

    const personSelect = new mdc.select.MDCSelect(personInput);

}

function addMedicalDiagnosisRow(event) {

    let rowCount = parseInt(event.target.getAttribute('data-row-count'));
    if (!rowCount) {
        rowCount = 1;
    }
    let histories_medicalDiagnosisTable_body = document.getElementById('histories_medicalDiagnosisTable_body');
    let row = document.createElement('tr');
    row.classList.add('mdc-data-table__row');
    row.innerHTML = `<td class="mdc-data-table__cell">
                                                            Diagnosis
                                                        </td>
                                                        <td class="mdc-data-table__cell">
                                                            <div class="mdc-text-field mdc-text-field--filled w-100 mdc-ripple-upgraded" style="--mdc-ripple-fg-size: 82px; --mdc-ripple-fg-scale: 1.9347754120133305; --mdc-ripple-fg-translate-start: 32.7833251953125px, -8.04998779296875px; --mdc-ripple-fg-translate-end: 27.850006103515625px, -13px;">
                                                                <span class="mdc-text-field__ripple"></span>
                                                                <input id="histories_medicalDiagnosis${rowCount}" class="mdc-text-field__input medicalDiagnosis" type="text" aria-labelledby="name-floating-label">
                                                                <span class="mdc-floating-label" id="name-floating-label">Diagnosis</span>
                                                                <span class="mdc-line-ripple" style="transform-origin: 57.7833px center 0px;"></span>
                                                            </div>
                                                        </td>
                                                        <td class="mdc-data-table__cell">
                                                            Age Diagnosed
                                                        </td>
                                                        <td class="mdc-data-table__cell">
                                                            <div class="mdc-text-field mdc-text-field--filled w-100 mdc-ripple-upgraded">
                                                                <span class="mdc-text-field__ripple"></span>
                                                                <input id="histories_medicalDiagnosisAge${rowCount}" class="mdc-text-field__input medicalDiagnosisAge" type="number" aria-labelledby="name-floating-label">
                                                                <span class="mdc-floating-label" id="name-floating-label">Age</span>
                                                                <span class="mdc-line-ripple"></span>
                                                            </div>
                                                        </td>
                                                        <td class="mdc-data-table__cell">
                                                            Description/Meds
                                                        </td>
                                                        <td class="mdc-data-table__cell">
                                                            <div class="mdc-text-field mdc-text-field--filled w-100 mdc-ripple-upgraded">
                                                                <span class="mdc-text-field__ripple"></span>
                                                                <input id="histories_medicalDiagnosisDesc${rowCount}" class="mdc-text-field__input medicalDiagnosisDesc" type="text" aria-labelledby="name-floating-label">
                                                                <span class="mdc-floating-label" id="name-floating-label">Description/Meds</span>
                                                                <span class="mdc-line-ripple"></span>
                                                            </div>
                                                        </td>`;

    histories_medicalDiagnosisTable_body.insertBefore(row, event.target.parentNode.parentNode);
    row.querySelectorAll('.mdc-text-field').forEach((textField) => {
        new mdc.textField.MDCTextField(textField);
    });
    rowCount++;
    event.target.setAttribute('data-row-count', rowCount);
}

function addHearingVisionScreeningCustom(event) {
    let histories_hearingVisionTable_body = document.getElementById('histories_hearingVisionTable_body');
    rowCount = parseInt(event.target.getAttribute('data-row-count'));
    if (!rowCount) {
        rowCount = 1;
    }
    let row = document.createElement('tr');
    row.id = "histories_hearingVisionTable_body_custom" + rowCount;
    row.classList.add('mdc-data-table__row', 'hearingVisionTableCustom');
    row.innerHTML = `<td class="mdc-data-table__cell">
<div class="mdc-text-field mdc-text-field--filled w-100 mdc-ripple-upgraded">
<span class="mdc-text-field__ripple"></span>
<input class="mdc-text-field__input" type="text" aria-labelledby="name-floating-label">
<span class="mdc-floating-label" id="name-floating-label">Name</span>
<span class="mdc-line-ripple"></span>
</div>
</td>
<td>
<div class="mdc-text-field mdc-text-field--filled w-100 mdc-ripple-upgraded">
<span class="mdc-text-field__ripple"></span>
<input class="mdc-text-field__input" type="text" aria-labelledby="name-floating-label">
<span class="mdc-floating-label" id="name-floating-label">Result</span>
<span class="mdc-line-ripple"></span>
</div>
</td>
<td>
Date
</td>
<td>

<div class="mdc-text-field mdc-text-field--filled w-100 mdc-text-field--label-floating mdc-ripple-upgraded">
<span class="mdc-text-field__ripple"></span>
<input class="mdc-text-field__input" type="date" aria-labelledby="name-floating-label">
<span class="mdc-floating-label mdc-floating-label--float-above" id="name-floating-label">Date</span>
<span class="mdc-line-ripple"></span>
</div>
</td>
<td>
Description
</td>
<td>
<div class="mdc-text-field mdc-text-field--filled w-100 mdc-ripple-upgraded">
<span class="mdc-text-field__ripple"></span>
<input class="mdc-text-field__input" type="text" aria-labelledby="name-floating-label">
<span class="mdc-floating-label" id="name-floating-label">Description</span>
<span class="mdc-line-ripple"></span>
</div>
</td>`;

    histories_hearingVisionTable_body.insertBefore(row, event.target.parentNode.parentNode);
    row.querySelectorAll('.mdc-text-field').forEach((textField) => {
        new mdc.textField.MDCTextField(textField);
    });

    rowCount++;

    event.target.setAttribute('data-row-count', rowCount);

}

function buildGradeLevelElements(highestLevel) {
    console.log('Highest Level: ', highestLevel);
    topGradeLevel = highestLevel;
    let schoolEnrollmentHistoryTableBody = document.getElementById('histories_schoolEnrollmentHistory_body');
    while (schoolEnrollmentHistoryTableBody.firstChild) {
        schoolEnrollmentHistoryTableBody.removeChild(schoolEnrollmentHistoryTableBody.firstChild);
    }

    for (let i = 1; i <= highestLevel; i++) {
        let row = document.createElement('tr');
        row.classList.add('mdc-data-table__row');
        let label = gradeLevelTable[i];
        let temp = "records_schoolEnrollmentHistorySchool" + i;
        row.innerHTML = `<td class="mdc-data-table__cell">${label}</td>
<td class="mdc-data-table__cell">
<div class="mdc-text-field mdc-text-field--filled w-100">
<span class="mdc-text-field__ripple"></span>
<input id="${temp}"
class="mdc-text-field__input" type="text"
aria-labelledby="name-floating-label">
<span class="mdc-floating-label"
id="name-floating-label">School</span>
<span class="mdc-line-ripple"></span>
</div>
</td>`;
        schoolEnrollmentHistoryTableBody.appendChild(row);
    }
    schoolEnrollmentHistoryTableBody.querySelectorAll('.mdc-text-field').forEach((textField) => {
        new mdc.textField.MDCTextField(textField);
    });

    let classroomPerformanceHistoryDiv = document.getElementById('histories_classroomPerformanceHistory');


    while (classroomPerformanceHistoryDiv.firstChild) {
        classroomPerformanceHistoryDiv.removeChild(classroomPerformanceHistoryDiv.firstChild);
    }
    let header = document.createElement('thead');
    header.classList.add('mdc-data-table__header');
    header.innerHTML = `<tr class="mdc-data-table__header-row">
<th class="mdc-data-table__header-cell" role="columnheader" scope="col"
colspan="3">
Classroom Performance History
</th>
</tr>`;
    classroomPerformanceHistoryDiv.appendChild(header);


    for (let i = highestLevel; i > highestLevel - 3; i--) {
        let header = document.createElement('thead');
        header.classList.add('mdc-data-table__header');
        header.innerHTML = `<tr id=${i} class="mdc-data-table__header-row">
<th style="text-align: center;" class="mdc-data-table__header-cell"
role="columnheader" scope="col" colspan="3">
Grade Level: ${gradeLevelTable[i]}
</th>
</tr>
<tr class="mdc-data-table__header-row">
<th class="mdc-data-table__header-cell" role="columnheader" scope="col">
Subject
</th>
<th class="mdc-data-table__header-cell" role="columnheader" scope="col">
Fall
</th>
<th class="mdc-data-table__header-cell" role="columnheader" scope="col">
Spring
</th>
</tr>`;
        let content = document.createElement('tbody');
        content.id = "records_classroomPerformanceHistory_" + i;
        content.setAttribute('data-grade', i);
        content.classList.add('mdc-data-table__content');
        content.innerHTML = `<tr class="mdc-data-table__row">
<td class="mdc-data-table__cell">
<div class="mdc-text-field mdc-text-field--filled w-100">
<span class="mdc-text-field__ripple"></span>
<input class="histories_lastSubjectInput histories_subjectInput mdc-text-field__input" type="text"
aria-labelledby="name-floating-label">
<span class="mdc-floating-label"
id="name-floating-label">Subject</span>
<span class="mdc-line-ripple"></span>
</div>
</td>
<td class="mdc-data-table__cell">
<div class="mdc-text-field mdc-text-field--filled w-100">
<span class="mdc-text-field__ripple"></span>
<input class="mdc-text-field__input" type="text"
aria-labelledby="name-floating-label">
<span class="mdc-floating-label"
id="name-floating-label">Performance in Fall</span>
<span class="mdc-line-ripple"></span>
</div>
</td>
<td>
<div class="mdc-text-field mdc-text-field--filled w-100">
<span class="mdc-text-field__ripple"></span>
<input class="mdc-text-field__input" type="text"
aria-labelledby="name-floating-label">
<span class="mdc-floating-label"
id="name-floating-label">Performance in Spring</span>
<span class="mdc-line-ripple"></span>
</div>
</td>
</tr>`;
        classroomPerformanceHistoryDiv.appendChild(header);
        classroomPerformanceHistoryDiv.appendChild(content);

        content.querySelectorAll('.mdc-text-field').forEach((textField) => {
            new mdc.textField.MDCTextField(textField);
        });

    }

    const handleKeydown = function (event) {
        if (event.key !== 'Enter') {

            this.removeEventListener('keydown', handleKeydown);
            this.classList.remove('histories_lastSubjectInput');
            console.log("WTF");
            let row = document.createElement('tr');
            row.classList.add('mdc-data-table__row');
            row.innerHTML = `<td class="mdc-data-table__cell"> <div class="mdc-text-field mdc-text-field--filled w-100"> <span class="mdc-text-field__ripple"></span> <input class="histories_lastSubjectInput histories_subjectInput mdc-text-field__input" type="text" aria-labelledby="name-floating-label"> <span class="mdc-floating-label" id="name-floating-label">Subject</span> <span class="mdc-line-ripple"></span> </div> </td> <td class="mdc-data-table__cell"> <div class="mdc-text-field mdc-text-field--filled w-100"> <span class="mdc-text-field__ripple"></span> <input class="mdc-text-field__input" type="text" aria-labelledby="name-floating-label"> <span class="mdc-floating-label" id="name-floating-label">Performance in Fall</span> <span class="mdc-line-ripple"></span> </div> </td> <td> <div class="mdc-text-field mdc-text-field--filled w-100"> <span class="mdc-text-field__ripple"></span> <input class="mdc-text-field__input" type="text" aria-labelledby="name-floating-label"> <span class="mdc-floating-label" id="name-floating-label">Performance in Spring</span> <span class="mdc-line-ripple"></span> </div> </td>`;
            let newLastInput = this.parentNode.parentNode.parentNode.parentNode;
            newLastInput.appendChild(row);

            row.querySelector('.histories_lastSubjectInput').addEventListener('keydown', handleKeydown);
            row.querySelectorAll('.mdc-text-field').forEach((textField) => {
                new mdc.textField.MDCTextField(textField);
            });
        }
    };

    let lastInputs = classroomPerformanceHistoryDiv.querySelectorAll('.histories_lastSubjectInput');
    for (let i = 0; i < lastInputs.length; i++) {
        let lastInput = lastInputs[i];


        lastInput.addEventListener('keydown', handleKeydown);
    }



    let addRowButton = document.createElement('button');
    addRowButton.id = 'add_school_performance_grade_row_btn';
    addRowButton.classList.add('mdc-button', 'mdc-button--raised', 'mdc-button--dense', 'mdc-button--outlined');
    addRowButton.textContent = 'Add Grade Level';
    addRowButton.style.marginTop = '10px';
    addRowButton.style.marginBottom = '10px';
    addRowButton.addEventListener('click', function () {

        let lastRow = classroomPerformanceHistoryDiv.lastChild.previousSibling;
        let lastRowGradeId = parseInt(lastRow.getAttribute('data-grade'));
        console.log("At row: ", lastRowGradeId);
        let header = document.createElement('thead');
        header.classList.add('mdc-data-table__header');
        header.innerHTML = `<tr id=${lastRowGradeId - 1} class="mdc-data-table__header-row"> <th style="text-align: center;" class="mdc-data-table__header-cell" role="columnheader" scope="col" colspan="3"> Grade Level: ${gradeLevelTable[lastRowGradeId - 1]} </th> </tr> <tr class="mdc-data-table__header-row"> <th class="mdc-data-table__header-cell" role="columnheader" scope="col"> Subject </th> <th class="mdc-data-table__header-cell" role="columnheader" scope="col"> Fall </th> <th class="mdc-data-table__header-cell" role="columnheader" scope="col"> Spring </th> </tr>`;
        let content = document.createElement('tbody');
        content.setAttribute('data-grade', lastRowGradeId - 1);
        content.classList.add('mdc-data-table__content');
        content.innerHTML = `<tr class="mdc-data-table__row"> <td class="mdc-data-table__cell"> <div class="mdc-text-field mdc-text-field--filled w-100"> <span class="mdc-text-field__ripple"></span> <input class="histories_lastSubjectInput histories_subjectInput mdc-text-field__input" type="text" aria-labelledby="name-floating-label"> <span class="mdc-floating-label" id="name-floating-label">Subject</span> <span class="mdc-line-ripple"></span> </div> </td> <td class="mdc-data-table__cell"> <div class="mdc-text-field mdc-text-field--filled w-100"> <span class="mdc-text-field__ripple"></span> <input class="mdc-text-field__input" type="text" aria-labelledby="name-floating-label"> <span class="mdc-floating-label" id="name-floating-label">Performance in Fall</span> <span class="mdc-line-ripple"></span> </div> </td> <td> <div class="mdc-text-field mdc-text-field--filled w-100"> <span class="mdc-text-field__ripple"></span> <input class="mdc-text-field__input" type="text" aria-labelledby="name-floating-label"> <span class="mdc-floating-label" id="name-floating-label">Performance in Spring</span> <span class="mdc-line-ripple"></span> </div> </td>`;

        classroomPerformanceHistoryDiv.insertBefore(header, classroomPerformanceHistoryDiv.lastChild);
        classroomPerformanceHistoryDiv.insertBefore(content, classroomPerformanceHistoryDiv.lastChild);
        content.querySelectorAll('.mdc-text-field').forEach((textField) => {
            new mdc.textField.MDCTextField(textField);
        });

        content.querySelector('.histories_lastSubjectInput').addEventListener('keydown', handleKeydown);

        if (lastRowGradeId == 1) {
            addRowButton.style.display = 'none';
        }
    });


    classroomPerformanceHistoryDiv.appendChild(addRowButton);

}

function getSubjectStandardMetRow(gradeLevel) {
    return `<td class="mdc-data-table__cell">${gradeLevel}</td>
<td class="mdc-data-table__cell">
<div class="mdc-text-field mdc-text-field--filled w-100">
<span class="mdc-text-field__ripple"></span>
<input id="histories_subjectStandardMetStandard1"
class="mdc-text-field__input" type="text"
aria-labelledby="name-floating-label">
<span class="mdc-floating-label" id="name-floating-label">Rating
</span>
<span class="mdc-line-ripple"></span>
</div>
</td>
<td class="mdc-data-table__cell">
<div class="mdc-text-field mdc-text-field--filled w-100">
<span class="mdc-text-field__ripple"></span>
<input id="histories_subjectStandardMetStandard1"
class="mdc-text-field__input" type="text"
aria-labelledby="name-floating-label">
<span class="mdc-floating-label" id="name-floating-label">Rating
</span>
<span class="mdc-line-ripple"></span>
</div>
</td>
<td class="mdc-data-table__cell">
<div class="mdc-text-field mdc-text-field--filled w-100">
<span class="mdc-text-field__ripple"></span>
<input id="histories_subjectStandardMetStandard1"
class="mdc-text-field__input" type="text"
aria-labelledby="name-floating-label">
<span class="mdc-floating-label" id="name-floating-label">Rating
</span>
<span class="mdc-line-ripple"></span>
</div>
</td>
<td class="mdc-data-table__cell">
<div class="mdc-text-field mdc-text-field--filled w-100">
<span class="mdc-text-field__ripple"></span>
<input id="histories_subjectStandardMetStandard1"
class="mdc-text-field__input" type="text"
aria-labelledby="name-floating-label">
<span class="mdc-floating-label" id="name-floating-label">Rating
</span>
<span class="mdc-line-ripple"></span>
</div>
</td>`;
}

function getAttendanceHistoryRow(gradeLevel) {
    return `<tr class="mdc-data-table__row" id="">
<td class="mdc-data-table__cell">${gradeLevel}</td>
<td class="mdc-data-table__cell">
<div class="mdc-text-field mdc-text-field--filled w-100">
<span class="mdc-text-field__ripple"></span>
<input id="histories_attendanceHistoryAttendance1"
class="mdc-text-field__input" type="number"
aria-labelledby="name-floating-label">
<span class="mdc-floating-label" id="name-floating-label">Days
Enrolled
</span>
<span class="mdc-line-ripple"></span>
</div>
</td>
<td class="mdc-data-table__cell">
<div class="mdc-text-field mdc-text-field--filled w-100">
<span class="mdc-text-field__ripple"></span>
<input id="histories_attendanceHistoryTardies1"
class="mdc-text-field__input" type="number"
aria-labelledby="name-floating-label">
<span class="mdc-floating-label" id="name-floating-label">Tardies
</span>
<span class="mdc-line-ripple"></span>
</div>
</td>
<td class="mdc-data-table__cell">
<div class="mdc-text-field mdc-text-field--filled w-100">
<span class="mdc-text-field__ripple"></span>
<input id="histories_attendanceHistoryAbsent1"
class="mdc-text-field__input" type="number"
aria-labelledby="name-floating-label">
<span class="mdc-floating-label" id="name-floating-label">Days
Absent
</span>
<span class="mdc-line-ripple"></span>
</div>
</td>
<td class="mdc-data-table__cell">
<span class="table-badge">100%</span>
</td>
</tr>`;
}

function addStudentClinicalInterviewRow(event) {
    let clinicalInterviewsStudentTable = document.getElementById('clinicalInterviewsStudentTable');
    let rowCount = parseInt(event.target.getAttribute('data-row-count'));
    if (!rowCount) {
        rowCount = 1;
    }
    let row = document.createElement('tr');
    row.classList.add('mdc-data-table__row');

    row.innerHTML = `<tr class="mdc-data-table__row">
<td class="mdc-data-table__cell">
<div
class="mdc-text-field mdc-text-field--filled w-100 mdc-ripple-upgraded">
<span class="mdc-text-field__ripple"></span>
<input class="mdc-text-field__input customStudentInterviewQuestion" type="text"
aria-labelledby="name-floating-label">
<span class="mdc-floating-label" id="name-floating-label">Custom
Question ${rowCount}</span>
<span class="mdc-line-ripple"></span>
</div>
</td>
</tr>
<tr>
<td colspan="4">
<div
class="mdc-text-field mdc-text-field--filled w-100 mdc-ripple-upgraded">
<span class="mdc-text-field__ripple"></span>
<input class="mdc-text-field__input customStudentInterviewResponse" type="text"
aria-labelledby="name-floating-label">
<span class="mdc-floating-label"
id="name-floating-label">Response</span>
<span class="mdc-line-ripple"></span>
</div>
</td>`;
    event.target.parentNode.parentNode.parentNode.insertBefore(row, event.target.parentNode.parentNode);
    row.querySelectorAll('.mdc-text-field').forEach((textField) => {
        new mdc.textField.MDCTextField(textField);
    });
    rowCount++;
    event.target.setAttribute('data-row-count', rowCount);
}

function addParentToClinicalInterviews(event) {

    let parentInput = document.createElement('div');
    parentInput.classList.add('mdc-text-field', 'mdc-text-field--filled', 'w-100', 'mdc-ripple-upgraded');
    parentInput.innerHTML = `
                    <span class="mdc-text-field__ripple"></span>
                    <input id="clinicalInterviews_parentName2" class="mdc-text-field__input" type="text"
                        aria-labelledby="name-floating-label">
                        <span class="mdc-floating-label" id="name-floating-label">Parent
                            Name</span>
                        <span class="mdc-line-ripple"></span>`;
    event.target.parentNode.parentNode.insertBefore(parentInput, event.target.parentNode);
    event.target.parentNode.removeChild(event.target);
    new mdc.textField.MDCTextField(parentInput);

    let clinicalInterviewsParent_question1 = document.getElementById('clinicalInterviewsParent_question1');
    clinicalInterviewsParent_question1.textContent = "Parent's names being interviewed";

}



dynamicElementYears = document.querySelectorAll('.dynamicElementYear');

for (let i = 2; i < 100; i++) {
    for (let j = 0; j < dynamicElementYears.length; j++) {
        let li = document.createElement('li');
        li.classList.add('mdc-list-item');
        li.setAttribute('data-value', 'A');
        li.innerHTML = '<span class="mdc-list-item__ripple"></span><span class="mdc-list-item__text">' + i + ' years</span>';
        dynamicElementYears[j].appendChild(li);
    }
}
dynamicElementMonths = document.querySelectorAll('.dynamicElementMonth');

for (let i = 2; i < 37; i++) {
    for (let j = 0; j < dynamicElementMonths.length; j++) {
        let li = document.createElement('li');
        li.classList.add('mdc-list-item');
        li.setAttribute('data-value', 'A');
        li.innerHTML = '<span class="mdc-list-item__ripple"></span><span class="mdc-list-item__text">' + i + ' months</span>';
        dynamicElementMonths[j].appendChild(li);
    }
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}
async function toBase64FromUrl(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);

        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(function () {
        console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
}

function copyTextFromElement(elementId) {
    let element = document.getElementById(elementId);

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        navigator.clipboard.writeText(element.value).then(function () {
            console.log('Async: Copying to clipboard was successful!');
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
    } else {
        navigator.clipboard.writeText(element.textContent).then(function () {
            console.log('Async: Copying to clipboard was successful!');
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
    }
}