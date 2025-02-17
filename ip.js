document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn');
    const myIpBtn = document.getElementById('my-ip-btn');
    const ipInput = document.getElementById('ip-input');

    // Função para solicitar localização
    function requestLocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Sucesso - usuário permitiu a localização
                    fetch('https://ipapi.co/json/')
                        .then(response => response.json())
                        .then(data => {
                            ipInput.value = data.ip;
                            // Atualiza as coordenadas com a localização real do usuário
                            data.latitude = position.coords.latitude;
                            data.longitude = position.coords.longitude;
                            updateUI(data);
                        })
                        .catch(handleError);
                },
                (error) => {
                    // Erro ou usuário negou a localização
                    console.warn("Erro de localização:", error);
                    // Fallback para IP
                    fetch('https://ipapi.co/json/')
                        .then(response => response.json())
                        .then(data => updateUI(data))
                        .catch(handleError);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            console.warn("Geolocalização não suportada");
            // Fallback para IP
            fetch('https://ipapi.co/json/')
                .then(response => response.json())
                .then(data => updateUI(data))
                .catch(handleError);
        }
    }

    // Search IP on button click
    searchBtn.addEventListener('click', searchIP);
    
    // Get MY IP on button click
    myIpBtn.addEventListener('click', () => {
        ipInput.value = '';
        requestLocation();
    });
    
    // Search IP when Enter key is pressed
    ipInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchIP();
        }
    });

    // Get user's location on page load
    requestLocation();
});

let map;
let marker;

function initMap(lat, lon) {
    if (map) {
        map.remove();
    }

    map = L.map('map').setView([lat, lon], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([lat, lon]).addTo(map)
        .bindPopup('Location Found!')
        .openPopup();
}

function updateUI(data) {
    document.getElementById('result').style.display = 'grid';
    
    const elements = ['ip', 'location', 'isp', 'country', 'city', 'timezone'];
    elements.forEach((el, index) => {
        setTimeout(() => {
            const element = document.getElementById(el);
            element.style.opacity = '0';
            
            setTimeout(() => {
                if (el === 'location') {
                    element.textContent = `${data.latitude}, ${data.longitude}`;
                } else if (el === 'isp') {
                    element.textContent = data.org || '-';
                } else if (el === 'country') {
                    element.textContent = data.country_name;
                } else if (el === 'timezone') {
                    element.textContent = data.timezone;
                } else if (el === 'ip') {
                    element.textContent = data.ip;
                } else {
                    element.textContent = data[el] || '-';
                }
                element.style.opacity = '1';
            }, 200);
        }, index * 100);
    });

    // Inicializa o mapa com as coordenadas
    initMap(data.latitude, data.longitude);
}

function searchIP() {
    const ipInput = document.getElementById('ip-input');
    const query = ipInput.value.trim();
    
    if (query) {
        // Verifica se é um domínio
        if (isDomain(query)) {
            // Primeiro resolve o domínio para IP
            fetch(`https://dns.google/resolve?name=${query}`)
                .then(response => response.json())
                .then(data => {
                    if (data.Answer && data.Answer[0]) {
                        // Usa o IP resolvido para buscar a localização
                        return fetch(`https://ipapi.co/${data.Answer[0].data}/json/`);
                    } else {
                        throw new Error('Domain could not be resolved');
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        throw new Error('Location not found');
                    }
                    // Adiciona o domínio original aos dados
                    data.domain = query;
                    updateUI(data);
                })
                .catch(handleError);
        } else {
            // Processa como IP normalmente
            fetch(`https://ipapi.co/${query}/json/`)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        throw new Error('IP not found');
                    }
                    updateUI(data);
                })
                .catch(handleError);
        }
    }
}

function isDomain(query) {
    // Regex simples para verificar se é um domínio
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    return domainRegex.test(query);
}

function handleError(error) {
    alert('Erro: Não foi possível encontrar a localização. Por favor, verifique se o IP ou domínio está correto.');
    console.error(error);
}