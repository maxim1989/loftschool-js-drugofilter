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
                  {{/each}}`;
                  
let sessionInfo = null,
    friends = null,
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
                resolve(r.response.items);
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
        const friendList = await friendsGet();

        fillFriendsListLeft(friendList);
    
        leftFriendBlock.addEventListener('dragstart', onDragStart);
        leftFriendBlock.addEventListener('click', onAddClick);
    
        rightFriendBlock.addEventListener('dragover', onDragOver);
        rightFriendBlock.addEventListener('drop', onDrop);
    } catch(e) {
        console.error(e);
    }
    
}

/**
 * Заполнить начальный список друзей.
 * @param {*} friends 
 */
function fillFriendsListLeft(friends) {
    const render = Handlebars.compile(template),
        html = render({friends: friends, action: 'src/image/add.png'});

    leftFriendBlock.innerHTML = html;

}

/**
 * Заполнить новый список друзей.
 * @param {*} friends 
 */
function fillFriendsListRight(friends) {
    const render = Handlebars.compile(template),
        html = render({friends: friends, action: 'src/image/close_grey.png'});

    rightFriendBlock.innerHTML = html;
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

    img.src = "src/image/close_grey.png";
    rightFriendBlock.appendChild(friendHtml);
}

function onAddClick(event) {
    event.preventDefault();
    if (event.target.className === 'IconAdd__Image') {
        const friendId = event.target.dataset.vkuserid,
            friendBlock = leftFriendBlock.querySelector(`#vkUserId${friendId}`);

        rightFriendBlock.appendChild(friendBlock);
    }
}