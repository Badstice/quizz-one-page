const opentdb = {
    urlAskSessionToken: 'https://opentdb.com/api_token.php?command=request',
    urlAskCategories: 'https://opentdb.com/api_category.php',
}

const settings = {
    state: 0,
    sessionToken: '',
    categories: [],
    difficulties: ['easy', 'medium', 'hard'],
    difficulty: 0,
    correct_answer: 0,
    timer: () => { return;},
    score: 0,
}

const elements = {
    devNav: document.getElementById('devNav'),
    nav: document.querySelector('nav'),
    quizz: document.getElementById('quizz'),
    question: document.getElementById('question'),
    time: document.getElementById('time'),
    score: document.getElementById('score').lastElementChild,
    buttonsRsp: document.querySelectorAll('.button.rsp'),
    buttonsP: document.querySelectorAll('.button.rsp p'),
    btnNext: document.getElementById('btnNext'),
}

const btnState = {
    reset: 0,
    asw: 1,
    aswGoodAsw: 2,
    goodAsw: 3,
    badAsw: 4,
    otherAsw: 5,
}

/**
 * Log message
 * @param {string} msg - Message print in the console
 * @param {object} complement - Print objectin the console
 */
function log(msg, complement) {
    if (true) {
        console.log(msg);
        if (complement) Object.values(complement).forEach(v => console.log(v));
    }
}

/**
 * Function to randomise an array
 * @param {array}
 */
function randomArray(array){
    return array.sort((a,b) => 0.5 - Math.random());
}

/**
 * Créer une div rouge avec le message d'erreur en plein écran
 * @param {string} err - Message d'erreur affiché sur la page
 */
function showError(err) {
    const div = document.createElement('div'), p = document.createElement('p');
    div.appendChild(p);
    p.innerText = err;
    div.style = 'position: fixed; top: 5%; right: 5%; bottom: 5%; left: 5%; backgound-color: red; color: white; font-size: 3em; display: flex; justify-content: center; align-item: center; align-content: center';
}


/**
 * Permet de capturer lié aux anciens navigateurs et d'afficher le message d'erreur
 */
function cathErrorNav() {
}

/**
 * Permet de capturer les requêtes qui échouent et d'afficher le message d'erreur
 * @param {string} err - Erreur
 */
function cathErrorAPI(err) {
    console.log(err);
    showError('Connexion à la base de donnée impossible');
}

/**
 * Request token session
 * @param {string} url - Url to ask the session token
 */
function getSessionToken(url) {
    fetch(url)
        .then(res => {
            if (res.ok)
                return res.json();
            cathErrorAPI('Session Token : BAD resquest');
        })
        .then(json => {
            if (json.response_code === 0) {
                settings.sessionToken = json.token;
            } else {
                cathErrorAPI(json.response_message);
            }
        })
        .catch(cathErrorAPI);
}


/**
 * Requête l'API pour avoir les catégories
 * TODO: utiliser la un function checker qui check et ajoute sessionstorage
 * @param {string} url - Url to ask categoires
 */
function getCategories(url) {
    fetch(url, { method: 'GET' })
        .then(res => {
            if (!res.ok) {
                cathErrorAPI('Connexion opentdb error');
                return;
            }
            return res.json();
        })
        .then(data => {
            const localData = settings.categories.length > 0;
            const categories = document.getElementById('categories');
            data.trivia_categories.forEach(category => {
                const div = document.createElement('div'),
                    label = document.createElement('p');
                categories.appendChild(div);
                div.className = 'checkBtn';
                div.appendChild(label);
                const id = `cat_${category.id}`;
                div.id = id;
                div.dataset.value = category.id;
                if (localData) {
                    if (settings.categories.includes(category.id.toString()))
                        div.dataset.selected = true;
                    else
                        div.dataset.selected = false;
                } else {
                    settings.categories.push(category.id.toString());
                    div.dataset.selected = true;
                }
                label.innerText = category.name;
            })
            categories.addEventListener('click', event => btnCollectionChange(event, settings.categories).then(newCategories => {
                settings.categories = newCategories;
                localStorage.setItem('categories', settings.categories.join());
            }).catch(cathErrorAPI));
        })
    .catch(console.error)
}

//TODO: ajoute addEventListener sur switch, checkBtn et data-grp

function btnCollectionChange(event, elements) {
    return new Promise((resolve, reject) => {
        const target = event.target,
            span    = target.nodeName === 'DIV' ? target : target.parentNode,
            value = span.dataset.value,
            selected = span.dataset.selected;
        if (selected === "true") {
            if (elements.length > 1) {
                elements = elements.filter(e => (e.toString() !== value.toString()));
                span.dataset.selected = false;
            } else {
                reject('0 elements');
            }
        } else {
            elements.push(value);
            span.dataset.selected = true;
        }
        resolve (elements);
    })

}

getCategories(opentdb.urlAskCategories);
document.getElementById('difficulties').addEventListener('click', event => btnCollectionChange(event, settings.difficulties).then(newdifficulties => {
    settings.difficulties = newdifficulties;
    localStorage.setItem('difficulties', settings.difficulties.join());
}).catch(cathErrorAPI));

/**
 * Build the API url
 * @returns {Request} Request API
 */
function createRequest() {
    const category = settings.categories[Math.floor(Math.random() * settings.categories.length)],
        difficulty  = settings.difficulties[Math.floor(Math.random() * settings.difficulties.length)];
    return new Request(`https://opentdb.com/api.php?amount=1&category=${category}&difficulty=${difficulty}&type=multiple&encode=base64`, {method: 'GET'});
}

function nextQuestion() {
    log('next question')
    if (settings.state === 1) return;
    fetch(createRequest())
        .then(res => {
            if (res.ok)
                return res.json();
            cathErrorAPI('Request question ERROR');
        })
        .then(json => {
            if (json.response_code === 0) {
                const ques = json.results[0];
                elements.question.innerText = decodeURIComponent(escape(window.atob(ques.question)));
                
                const asws = randomArray([...ques.incorrect_answers, ques.correct_answer]).map(r => (decodeURIComponent(escape(window.atob( r )))));
                settings.difficulty = ques.difficulty === 'aGFyZA==' ? 3 : ques.difficulty === 'bWVkaXVt' ? 2 : 1;

                settings.correct_answer = asws.indexOf(decodeURIComponent(escape(window.atob( ques.correct_answer ))));
                setTimeout(() => { 
                    for (let i = 0; i < elements.buttonsP.length; i++) {
                        elements.buttonsP[i].innerHTML = asws[i];
                        elements.buttonsRsp[i].dataset.rsp = i;
                    }
                    settings.state = 1;
                    settings.timer = timer(10000, 1000, rest => {
                        const aff = rest / 1000;
                        elements.time.innerText = aff.toString();
                        if (elements.time.className === 'up')
                            elements.time.className = 'down';
                        else
                            elements.time.className = 'up';
                    }, () => stop());
                }, 5000);
            } else {
                cathErrorAPI(json.response_message);
            }
        })
}

function showRsp() {
    log('show rsp')
    if (settings.state === 1)
        return;
    
    elements.buttonsP.forEach(p => {
        const b = p.parentElement, btn = b.dataset.btn, dataRsp = Number(b.dataset.rsp);
        if (dataRsp === settings.correct_answer && btn === '1') {
            b.dataset.btn = 2;
            settings.score += settings.difficulty;
        } else if (dataRsp === settings.correct_answer) {
            b.dataset.btn = 3;
        } else if (btn === '1') {
            settings.score -= settings.difficulty;
            b.dataset.btn = 4;
        } else if (btn === '0') {
            b.dataset.btn = 5;
        }
    });
    localStorage.setItem('score', settings.score);
    elements.score.innerText = `${settings.score} pts`;
    elements.btnNext.className = 'show';
    elements.time.className = 'hide';
}

function timer(delai, delta, callback, callbackEnd) {
    if (delai > 0) {
        settings.timer = setTimeout(() => {
            const rest = (delai - delta);
            callback(rest);
            timer(rest, delta, callback, callbackEnd);
        }, delta);
    } else {
        callbackEnd();
    }
}

function resetButtons(){
    elements.buttonsRsp.forEach(e => {
        e.dataset.btn = 0;
    });
    elements.buttonsP.forEach(e => {
        e.innerText = '';
    });
}


function stop() {
    if (settings.state === 0)
    return;
    log('stop')
    clearTimeout(settings.timer);
    settings.state = 0;
    setTimeout(showRsp, 1000);
}

document.body.addEventListener('click', event => {
    const target = event.target;
    if (settings.state === 1) {
        const buttonRsp =
        (target.classList.contains('rsp')) ? target :
                (target.parentElement.classList.contains('rsp')) ? target.parentElement : null;
        if (buttonRsp !== null) {
            elements.buttonsRsp.forEach(p => {
                const dataRsp = p.dataset.rsp;
                if (dataRsp !== target.dataset.rsp) {
                    p.dataset.btn = 5;
                } else {
                    p.dataset.btn = 1;
                }
            });
            stop();
        }
    } else {
        if (target.id === 'btnNext' || target.parentNode.id === 'btnNext') {
            resetButtons();
            elements.btnNext.className = 'hide';
            elements.time.innerHTML = '10';
            elements.time.className = 'show';
            setTimeout(nextQuestion, 1000);
        }
    }
    
    if (target.id === 'devNav' || target.parentNode.id === 'devNav') {
        const newClass = elements.nav.dataset.navstate === 'dev' ? 'red' : 'dev';
        elements.nav.dataset.navstate = newClass;
        elements.devNav.dataset.navstate = newClass;
    }
});


function start() {
    const localCat = localStorage.getItem('categories'),
        localDif = localStorage.getItem('difficulties'),
        localScore = localStorage.getItem('score');
    if (localCat !== null) 
        settings.categories = localCat.split(',');
    if (localDif!== null) {
        settings.difficulties = localDif.split(',');
        document.body.querySelectorAll('#difficulties div[data-selected]').forEach(div => {
            if (settings.difficulties.includes(div.dataset.value))
                div.dataset.selected = true;
            else
                div.dataset.selected = false;
        });
    }
    if (localCat !== null) {
        settings.score = Number(localScore);
        elements.score.innerText = `${settings.score} pts`;
    }
}

start();