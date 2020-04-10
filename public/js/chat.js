const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('[name="message"]');
const $messageFormButton = $messageForm.querySelector('#send-message');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-url-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

// Auto scroll
const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const contentHeight = $messages.scrollHeight;

    // Scrolled value
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (contentHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

socket.on('message', (message) => {
    //console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('locationMessage', mapsUrl => {
    //console.log(mapsUrl);
    const html = Mustache.render(locationTemplate, {
        username: mapsUrl.username,
        mapsUrl: mapsUrl.url,
        createdAt: moment(mapsUrl.createdAt).format('HH:mm')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    $sidebar.innerHTML = html;
});

// Message form
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Disable form
    $messageFormButton.setAttribute('disabled', 'disabled');

    const message = $messageFormInput.value;

    socket.emit('sendMessage', message, (error) => {

        // Enable form
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }
        //console.log('Message delivered!');
    });
});


$locationButton.addEventListener('click', () => {

    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.');
    }

    $locationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {

        const userLocation = {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
        };

        socket.emit('sendLocation', userLocation, () => {
            //console.log('Location shared!');
            $locationButton.removeAttribute('disabled');
        });
    });
});

socket.emit('join', { username, room }, error => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});