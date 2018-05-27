document.addEventListener("DOMContentLoaded", ready);

// Шаблон друга.
const template = `{{#each friends}}
                    <div draggable="true" class="Friend" id="vkUserId{{id}}">
                        <div class="Friend__Avatar">
                            <img draggable="false" src="{{photo_100}}" alt="avatar" class="Friend__AvaterImage">
                        </div>
                        <div class="Friend__Name">
                            <p class="Friend__NameText">{{first_name}} {{last_name}}</p>
                        </div>
                        <div class="IconAdd">
                            <img data-vkuserid="{{id}}" draggable="false" class="IconAdd__Image" src="{{../action}}" alt="add">
                        </div>
                    </div>
                  {{/each}}`,
    addSrc = 'src/image/add.png',
    closeSrc = 'src/image/close_grey.png';
                  
let sessionInfo = null,
    friends = null,
    leftFriends = [],
    rightFriends = [],
    leftFriendBlock = null,
    rightFriendBlock = null;

/**
 * Загрузка DOM.
 */
function ready() {
    initVK();
    initPage();
    leftFriendBlock = document.querySelector('.FriendsList.FriendsList_Left .List');
    rightFriendBlock = document.querySelector('.FriendsList.FriendsList_Right .List');
}

/**
 * Инициализация VK.
 */
function initVK() {
    VK.init({
        apiId: 6491160
    });
}

/**
 * Авторизироваться.
 */
function auth() {
    return new Promise((resolve, reject) => {
        VK.Auth.login(response => {
            if (response.status === 'connected') {
                sessionInfo = response;
                resolve();
            } else if (response.status === 'not_authorized') {
                reject(new Error('Пользователь авторизован ВКонтакте, но не разрешил доступ приложению.'));
            } else {
                reject(new Error('Пользователь не авторизован ВКонтакте.'));
            }
        }, 2)
    });
}

/**
 * Получить список друзей.
 */
function friendsGet() {
    return new Promise((resolve, reject) => {
        VK.Api.call('friends.get', {fields: 'photo_100', v:"5.73"}, r => {
            if(r.response) {
                friends = r.response.items;
                if (true) {
                    console.warn('Store Empty');
                    for (const f of friends) {
                        leftFriends.push(f);
                    }
                } else {
                    console.warn('Store Not Empty');
                }
                resolve();
            } else {
                reject(new Error('Не удалось получить список друзей.'));
            }
        });
    });
}

/**
 * Первичная загрузка страницы.
 */
async function initPage() {
    try {
        await auth();
        await friendsGet();

        fillFriendsListLeft(leftFriends);
    
        leftFriendBlock.addEventListener('dragstart', onDragStart);
        leftFriendBlock.addEventListener('click', onAddClick);
    
        rightFriendBlock.addEventListener('dragover', onDragOver);
        rightFriendBlock.addEventListener('drop', onDrop);
        rightFriendBlock.addEventListener('click', onCloseClick);

        const leftSearch = document.querySelector('.DrugoFIlter__Form .DrugoFIlter__Form_search');

        leftSearch.addEventListener('input', onLeftSearchInput);
    } catch(e) {
        console.error(e);
    }
    
}

/**
 * Заполнить начальный список друзей.
 */
function fillFriendsListLeft(friends) {
    leftFriendBlock.innerHTML = '';

    const render = Handlebars.compile(template),
        html = render({friends: friends, action: addSrc});

    leftFriendBlock.innerHTML = html;

}

/**
 * Заполнить новый список друзей.
 */
function fillFriendsListRight(friends) {
    rightFriendBlock.innerHTML = '';

    const render = Handlebars.compile(template),
        html = render({friends: friends, action: closeSrc});

    rightFriendBlock.innerHTML = html;
}

/**
 * Обнавление хранилищ, когда происходит перенос друга из одного списка в другой.
 * @param {*} from 
 * @param {*} to 
 * @param {*} friendId 
 */
function updateArrays(from, to, friendId) {
    friendId = isFinite(friendId) ? Number(friendId) : Number(friendId.split('vkUserId')[1]);
    return from.filter(f => {
        if (f.id === friendId) {
            to.push(f);
            return false;
        }
        return true;
    });
}

function onDragStart(event) {
    event.dataTransfer.setData('text/html', event.target.id);
}

function onDragOver(event) {
    event.preventDefault();
}

function onDrop(event) {
    const friendId = event.dataTransfer.getData('text/html'),
        friendHtml = document.getElementById(friendId),
        img = friendHtml.querySelector('.IconAdd__Image');

    leftFriends = updateArrays(leftFriends, rightFriends, friendId);
    
    img.src = closeSrc;
    rightFriendBlock.appendChild(friendHtml);
}

function onAddClick(event) {
    event.preventDefault();
    if (event.target.className === 'IconAdd__Image') {
        const friendId = event.target.dataset.vkuserid,
            friendBlock = leftFriendBlock.querySelector(`#vkUserId${friendId}`),
            img = friendBlock.querySelector('.IconAdd__Image');

        leftFriends = updateArrays(leftFriends, rightFriends, friendId);

        img.src = closeSrc;
        rightFriendBlock.appendChild(friendBlock);
    }
}

function onCloseClick(event) {
    event.preventDefault();
    if (event.target.className === 'IconAdd__Image') {
        const friendId = event.target.dataset.vkuserid,
            friendBlock = rightFriendBlock.querySelector(`#vkUserId${friendId}`),
            img = friendBlock.querySelector('.IconAdd__Image');

        rightFriends = updateArrays(rightFriends, leftFriends, friendId);

        img.src = addSrc;
        leftFriendBlock.appendChild(friendBlock);
    }
}

function onLeftSearchInput(event) {
    const text = event.target.value;

    fillFriendsListLeft(leftFriends.filter(f => {
        if (f.first_name.toLowerCase().indexOf(text) >= 0 || f.last_name.toLowerCase().indexOf(text) >= 0) {
            return true;
        }
    }));
}