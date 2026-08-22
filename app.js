// --- Default Map Location: 경복궁 ---
const DEFAULT_CENTER = [37.5796, 126.9770];
const DEFAULT_ZOOM = 15;

let currentMode = 'travel'; // 'travel', 'business', 'custom', 'memo'
let itineraries = [];
let currentItineraryId = null;
let userItinerariesData = {
    travel: [],
    business: [],
    custom: [],
    memo: []
};
let map = null;
let markers = [];
let routeLine = null;
let previewMarker = null;
let searchTimeout = null;

// Routing State
let activeTravelMode = 'driving'; // 'walking', 'transit', 'driving', 'taxi'
let routeLegs = [];
let routeCoordinates = [];

// API Settings Elements
const btnApiSettings = document.getElementById('btn-api-settings');
const apiSettingsModal = document.getElementById('api-settings-modal');
const googleApiKeyInput = document.getElementById('google-api-key-input');
const btnApiCancel = document.getElementById('btn-api-cancel');
const btnApiSave = document.getElementById('btn-api-save');

// Share Modal Elements
const btnShareLink = document.getElementById('btn-share-link');
const shareModal = document.getElementById('share-modal');
const shareHostInput = document.getElementById('share-host-input');
const shareUrlInput = document.getElementById('share-url-input');
const shareLocalWarning = document.getElementById('share-local-warning');
const btnCopyShareUrl = document.getElementById('btn-copy-share-url');
const btnExportJson = document.getElementById('btn-export-json');
const btnImportJsonTrigger = document.getElementById('btn-import-json-trigger');
const importJsonFileInput = document.getElementById('import-json-file-input');
const btnShareModalClose = document.getElementById('btn-share-modal-close');

// DOM Elements
const itinerarySelect = document.getElementById('itinerary-select');
const btnNewItinerary = document.getElementById('btn-new-itinerary');
const btnRenameItinerary = document.getElementById('btn-rename-itinerary');
const btnDeleteItinerary = document.getElementById('btn-delete-itinerary');
const btnSendItinerary = document.getElementById('btn-send-itinerary');
const sendItineraryMenu = document.getElementById('send-itinerary-menu');
const searchInput = document.getElementById('search-input');
const btnClearSearch = document.getElementById('btn-clear-search');
const searchResultsList = document.getElementById('search-results-list');
const placeCardsList = document.getElementById('place-cards-list');
const emptyState = document.getElementById('empty-state');
const placeCountBadge = document.getElementById('place-count');
const routeSummary = document.getElementById('route-summary');

// Modal Elements
const itineraryModal = document.getElementById('itinerary-modal');
const modalTitle = document.getElementById('modal-title');
const itineraryNameInput = document.getElementById('itinerary-name-input');
const modalErrorMessage = document.getElementById('modal-error-message');
const btnModalCancel = document.getElementById('btn-modal-cancel');
const btnModalSave = document.getElementById('btn-modal-save');
const itineraryModeSelect = document.getElementById('itinerary-mode-select');
let modalAction = 'create'; // 'create' or 'rename'

// Active Memo State
let activeMemoPlaceId = null;
let editingPlaceId = null; // Currently editing place in the route itinerary list

// Memo Modal Elements
const memoModal = document.getElementById('memo-modal');
const memoModalTitle = document.getElementById('memo-modal-title');
const memoPlaceName = document.getElementById('memo-place-name');
const memoDateInput = document.getElementById('memo-date-input');
const memoTimeInput = document.getElementById('memo-time-input');
const memoTextInput = document.getElementById('memo-text-input');
const btnMemoCancel = document.getElementById('btn-memo-cancel');
const btnMemoSave = document.getElementById('btn-memo-save');

const memoItinerarySelectSection = document.getElementById('memo-itinerary-select-section');
const memoTargetExisting = document.getElementById('memo-target-existing');
const memoTargetNew = document.getElementById('memo-target-new');
const memoTargetExistingContainer = document.getElementById('memo-target-existing-container');
const memoTargetExistingSelect = document.getElementById('memo-target-existing-select');
const memoTargetNewContainer = document.getElementById('memo-target-new-container');
const memoTargetNewName = document.getElementById('memo-target-new-name');
const memoTargetNewMode = document.getElementById('memo-target-new-mode');

// Export Modal Elements
const exportModal = document.getElementById('export-modal');
const exportSourceName = document.getElementById('export-source-name');
const exportModesContainer = document.getElementById('export-modes-container');
const btnExportCancel = document.getElementById('btn-export-cancel');
const btnExportSubmit = document.getElementById('btn-export-submit');

const exportTypeExisting = document.getElementById('export-type-existing');
const exportTypeNew = document.getElementById('export-type-new');
const exportExistingSection = document.getElementById('export-existing-section');
const exportNewSection = document.getElementById('export-new-section');
const exportNewModeSelect = document.getElementById('export-new-mode-select');
const exportNewItName = document.getElementById('export-new-it-name');
const exportNewPlaceDetails = document.getElementById('export-new-place-details');
const exportNewPlaceName = document.getElementById('export-new-place-name');
const exportNewDate = document.getElementById('export-new-date');
const exportNewTime = document.getElementById('export-new-time');
const exportNewMemo = document.getElementById('export-new-memo');

// Export State
let exportSourceData = null; // { type: 'place', data: placeObj } or { type: 'itinerary', data: itineraryObj }
let selectedTargetMode = null;
let selectedTargetItineraryId = null;

// Custom Confirmation Modal Elements
let confirmCallback = null;
const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
const btnConfirmYes = document.getElementById('btn-confirm-yes');

// Custom Toast System
function showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background-color: rgba(30, 41, 59, 0.95);
            color: #ffffff;
            padding: 12px 24px;
            border-radius: var(--border-radius-md, 10px);
            border: 1px solid var(--primary-blue, #2196F3);
            box-shadow: var(--shadow-premium);
            z-index: 99999;
            font-weight: 600;
            font-size: 0.9rem;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
            opacity: 0;
            pointer-events: none;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        toast.style.opacity = '0';
    }, 2500);
}

// Format date with day of the week in Korean e.g. 2026-06-04 (목)
function formatDateWithDay(dateStr) {
    if (!dateStr) return '날짜 미정';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dayName = days[d.getDay()];
    return `${dateStr} (${dayName})`;
}

// Custom Confirm Helper
function showConfirm(title, message, onConfirm) {
    confirmTitle.innerHTML = title;
    confirmMessage.innerHTML = message;
    confirmCallback = onConfirm;
    confirmModal.style.display = 'flex';
    if (typeof updateConfirmModalTheme === 'function') {
        updateConfirmModalTheme();
    }
}

function closeConfirm() {
    confirmModal.style.display = 'none';
    confirmCallback = null;
}

// --- Map Initialization ---
function initMap() {
    map = L.map('map', {
        doubleClickZoom: false,
        preferCanvas: false,
        worldCopyJump: true,
        minZoom: 3
    }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        noWrap: false,
        updateWhenIdle: false,
        keepBuffer: 3
    }).addTo(map);

    map.on('dblclick', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        showAddPlacePopup(lat, lng);
    });
}

function showAddPlacePopup(lat, lng) {
    if (previewMarker) {
        map.removeLayer(previewMarker);
        previewMarker = null;
    }
    
    let themeColor = 'var(--primary-blue, #2196F3)';
    if (currentMode === 'business') themeColor = '#a855f7';
    else if (currentMode === 'custom') themeColor = 'var(--primary-green, #4CAF50)';
    else if (currentMode === 'memo') themeColor = '#eab308';

    const defaultName = `지정 장소 (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    
    const iconHtml = `
        <div class="marker-pin pin-preview">
            <span class="marker-number">?</span>
        </div>
    `;
    
    const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: iconHtml,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
    });
    
    const popupHtml = `
        <div class="map-popup-add-place" style="width: 180px; display: flex; flex-direction: column; gap: 6px;">
            <h4 style="margin: 0; font-size: 0.85rem; color: #fff; font-weight: 700;">새 장소 추가</h4>
            <input type="text" id="map-place-name-input" class="modal-input" style="padding: 6px 8px; font-size: 0.8rem; width: 100%; box-sizing: border-box; margin: 2px 0 6px 0; background: #1e293b; border: 1px solid #475569; color: #fff; border-radius: 4px;" value="${defaultName}">
            <div style="display: flex; gap: 4px; justify-content: flex-end;">
                <button class="btn-popup-cancel" onclick="closePreviewMarker()" style="padding: 4px 8px; font-size: 0.75rem; background-color: #475569; color: #fff; border: none; border-radius: 3px; cursor: pointer; font-weight: 600;">취소</button>
                <button class="btn-popup-confirm" onclick="submitPreviewPlace(${lat}, ${lng})" style="padding: 4px 10px; font-size: 0.75rem; background-color: ${themeColor}; color: #fff; border: none; border-radius: 3px; cursor: pointer; font-weight: 600;">추가</button>
            </div>
        </div>
    `;
    
    previewMarker = L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupHtml, { closeOnClick: false, autoClose: false });
        
    map.panTo([lat, lng]);
    previewMarker.openPopup();
    
    // Focus and select the text input after a brief delay
    setTimeout(() => {
        const input = document.getElementById('map-place-name-input');
        if (input) {
            input.focus();
            input.select();
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    submitPreviewPlace(lat, lng);
                }
            });
        }
    }, 120);
}

window.closePreviewMarker = function() {
    if (previewMarker) {
        map.removeLayer(previewMarker);
        previewMarker = null;
    }
};

window.submitPreviewPlace = function(lat, lng) {
    const input = document.getElementById('map-place-name-input');
    const name = input ? input.value.trim() : `지정 장소 (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    if (name) {
        addPlaceToCurrentItinerary(name, lat, lng);
    }
    closePreviewMarker();
};

function showPreviewMarker(name, lat, lng, address) {
    if (previewMarker) {
        map.removeLayer(previewMarker);
        previewMarker = null;
    }
    
    const iconHtml = `
        <div class="marker-pin pin-preview">
            <span class="marker-number">?</span>
        </div>
    `;
    
    const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: iconHtml,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
    });
    
    const escapedName = name.replace(/'/g, "\\'");
    
    const popupHtml = `
        <div class="map-popup-preview">
            <h4 class="popup-title">${name}</h4>
            <p class="popup-address">${address || '좌표: ' + lat.toFixed(4) + ', ' + lng.toFixed(4)}</p>
            <button class="btn-popup-add" onclick="addPreviewPlaceToItinerary('${escapedName}', ${lat}, ${lng})">
                <i class="fa-solid fa-plus"></i> 일정에 추가
            </button>
        </div>
    `;
    
    previewMarker = L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupHtml);
        
    previewMarker.on('popupclose', function() {
        if (previewMarker) {
            map.removeLayer(previewMarker);
            previewMarker = null;
        }
    });
        
    map.panTo([lat, lng]);
    previewMarker.openPopup();
}

window.addPreviewPlaceToItinerary = function(name, lat, lng) {
    addPlaceToCurrentItinerary(name, lat, lng);
    if (previewMarker) {
        map.removeLayer(previewMarker);
        previewMarker = null;
    }
};

// --- Mode Management ---
function getModeName(mode) {
    switch (mode) {
        case 'travel': return '여행';
        case 'business': return '비즈니스';
        case 'custom': return '자유일정';
        case 'memo': return '자유메모';
        default: return '';
    }
}

function getSeedDataForMode(mode) {
    const defaultNames = {
        travel: '내 여행 일정',
        business: '내 비즈니스 일정',
        custom: '내 자유 일정',
        memo: '장소 메모'
    };
    return [
        {
            id: `itinerary-${mode}-default`,
            name: defaultNames[mode] || '기본 일정',
            mode: mode,
            places: []
        }
    ];
}

// --- LocalStorage Persistence Service ---
const PointMapStorage = {
    getDeviceId() {
        let deviceId = localStorage.getItem('point_map_device_id');
        if (!deviceId) {
            deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem('point_map_device_id', deviceId);
        }
        return deviceId;
    },

    getUserId() {
        return localStorage.getItem('point_map_user_id') || null;
    },

    setUserId(userId) {
        localStorage.setItem('point_map_user_id', userId);
    },

    getUserPassword() {
        return localStorage.getItem('point_map_user_password') || null;
    },

    setUserPassword(password) {
        localStorage.setItem('point_map_user_password', password);
    },

    migrateItinerary(itinerary, mode) {
        const deviceId = this.getDeviceId();
        const userId = this.getUserId();
        const now = new Date().toISOString();

        if (!itinerary.localUserId) itinerary.localUserId = deviceId;
        if (itinerary.userId === undefined) itinerary.userId = userId;
        if (!itinerary.createdAt) itinerary.createdAt = now;
        if (!itinerary.updatedAt) itinerary.updatedAt = now;
        if (!itinerary.mode) itinerary.mode = mode;

        if (Array.isArray(itinerary.places)) {
            itinerary.places.forEach(place => {
                if (!place.localUserId) place.localUserId = deviceId;
                if (place.userId === undefined) place.userId = userId;
                if (!place.createdAt) place.createdAt = now;
                if (!place.updatedAt) place.updatedAt = now;
            });
        }
        return itinerary;
    },

    loadItineraries(mode) {
        let list = userItinerariesData[mode] || [];
        if (!list || list.length === 0) {
            list = getSeedDataForMode(mode);
            userItinerariesData[mode] = list;
        }
        return list.map(it => this.migrateItinerary(it, mode));
    },

    saveItineraries(mode, itinerariesList) {
        const deviceId = this.getDeviceId();
        const userId = this.getUserId();
        const now = new Date().toISOString();

        const processed = itinerariesList.map(it => {
            it.updatedAt = now;
            if (!it.createdAt) it.createdAt = now;
            if (!it.localUserId) it.localUserId = deviceId;
            it.userId = userId;
            it.mode = mode;

            if (Array.isArray(it.places)) {
                it.places.forEach(place => {
                    if (!place.createdAt) place.createdAt = now;
                    if (!place.localUserId) place.localUserId = deviceId;
                    place.userId = userId;
                    if (!place.updatedAt) place.updatedAt = now;
                });
            }
            return it;
        });

        userItinerariesData[mode] = processed;
        saveAllDataToServer();
    },

    getCurrentItineraryId(mode) {
        return localStorage.getItem(`point_map_current_id_${mode}`);
    },

    setCurrentItineraryId(mode, id) {
        localStorage.setItem(`point_map_current_id_${mode}`, id);
    },

    getCurrentMode() {
        return localStorage.getItem('point_map_current_mode') || 'travel';
    },

    setCurrentMode(mode) {
        localStorage.setItem('point_map_current_mode', mode);
    },

    getActiveTravelMode() {
        return localStorage.getItem('point_map_active_travel_mode') || 'driving';
    },

    setActiveTravelMode(mode) {
        localStorage.setItem('point_map_active_travel_mode', mode);
    }
};

function getItinerariesForMode(mode) {
    return PointMapStorage.loadItineraries(mode);
}

function switchMode(targetMode) {
    if (currentMode === targetMode) return;
    
    // Save current state
    saveData();
    
    // Update active tab UI class
    document.querySelectorAll('.mode-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`mode-${targetMode}`).classList.add('active');
    
    // Switch state
    currentMode = targetMode;
    PointMapStorage.setCurrentMode(currentMode);
    document.body.className = `mode-theme-${currentMode}`;
    
    // Load target state
    loadData(targetMode);
    renderAll();
    
    // Fit map to places
    const activeIt = getCurrentItinerary();
    if (activeIt && activeIt.places.length > 0) {
        fitMapToPlaces(activeIt.places);
    } else {
        // Fallback to Gyeongbokgung if no places
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
    
    showToast(`[${getModeName(currentMode)}] 모드로 전환되었습니다.`);
}

function findMostRecentlyUpdatedItinerary() {
    let latestItinerary = null;
    let latestMode = null;
    let maxTime = 0;

    const modes = ['travel', 'business', 'custom', 'memo'];
    modes.forEach(mode => {
        const list = userItinerariesData[mode] || [];
        list.forEach(it => {
            let itTime = new Date(it.updatedAt || it.createdAt || 0).getTime();
            if (isNaN(itTime)) itTime = 0;

            if (Array.isArray(it.places)) {
                it.places.forEach(p => {
                    let pTime = new Date(p.updatedAt || p.createdAt || 0).getTime();
                    if (!isNaN(pTime) && pTime > itTime) {
                        itTime = pTime;
                    }
                });
            }

            if (itTime > maxTime) {
                maxTime = itTime;
                latestItinerary = it;
                latestMode = mode;
            }
        });
    });

    if (latestItinerary && latestMode) {
        return { mode: latestMode, itineraryId: latestItinerary.id };
    }
    return null;
}

// --- LocalStorage Persistence ---
function loadData(specifiedMode = null) {
    if (specifiedMode) {
        currentMode = specifiedMode;
        PointMapStorage.setCurrentMode(currentMode);
    } else {
        const recent = findMostRecentlyUpdatedItinerary();
        if (recent) {
            currentMode = recent.mode;
            PointMapStorage.setCurrentMode(currentMode);
        } else {
            currentMode = PointMapStorage.getCurrentMode();
        }
    }
    
    // Set active tab in UI
    document.querySelectorAll('.mode-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeTab = document.getElementById(`mode-${currentMode}`);
    if (activeTab) activeTab.classList.add('active');
    
    document.body.className = `mode-theme-${currentMode}`;
    
    // Load active travel mode
    activeTravelMode = PointMapStorage.getActiveTravelMode();
    if (activeTravelMode === 'taxi') {
        activeTravelMode = 'driving';
    }
    document.querySelectorAll('.route-mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === activeTravelMode) {
            btn.classList.add('active');
        }
    });
    
    itineraries = PointMapStorage.loadItineraries(currentMode);
    const savedCurrentId = PointMapStorage.getCurrentItineraryId(currentMode);
    
    if (!specifiedMode) {
        const recent = findMostRecentlyUpdatedItinerary();
        if (recent && recent.mode === currentMode && itineraries.some(it => it.id === recent.itineraryId)) {
            currentItineraryId = recent.itineraryId;
            PointMapStorage.setCurrentItineraryId(currentMode, currentItineraryId);
        } else if (savedCurrentId && itineraries.some(it => it.id === savedCurrentId)) {
            currentItineraryId = savedCurrentId;
        } else if (itineraries && itineraries.length > 0) {
            currentItineraryId = itineraries[0].id;
        } else {
            itineraries = getSeedDataForMode(currentMode);
            currentItineraryId = itineraries[0].id;
        }
    } else {
        if (savedCurrentId && itineraries.some(it => it.id === savedCurrentId)) {
            currentItineraryId = savedCurrentId;
        } else if (itineraries && itineraries.length > 0) {
            currentItineraryId = itineraries[0].id;
        } else {
            itineraries = getSeedDataForMode(currentMode);
            currentItineraryId = itineraries[0].id;
        }
    }
    saveData();
}

function saveAllDataToServer() {
    const userId = PointMapStorage.getUserId();
    const password = PointMapStorage.getUserPassword() || '';
    if (!userId) return;
    
    // Always persist to local storage under isolated user key
    ['travel', 'business', 'custom', 'memo'].forEach(mode => {
        if (userItinerariesData[mode]) {
            localStorage.setItem(`point_map_itineraries_${mode}_${userId}`, JSON.stringify(userItinerariesData[mode]));
        }
    });

    fetch(`/api/save?userId=${encodeURIComponent(userId)}&password=${encodeURIComponent(password)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(userItinerariesData)
    })
    .then(response => {
        if (!response.ok) {
            console.error('Failed to save data to server');
        }
    })
    .catch(err => {
        console.warn('Background server save fallback to local mode:', err);
    });
}

async function checkUserExists(userId) {
    try {
        const res = await fetch(`/api/check-user?userId=${encodeURIComponent(userId)}`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
            const data = await res.json();
            return data.exists;
        }
    } catch (e) {
        console.warn('Check user server API failed, checking local storage:', e);
    }
    // Fallback for static host / local client mode
    const storedUserPass = localStorage.getItem(`point_map_user_pass_${userId}`);
    return !!storedUserPass;
}

async function loginAndLoadDataFromServer(userId, password) {
    let result = null;
    let isServerAvailable = false;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({ userId, password })
        });
        
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            result = await response.json();
            if (response.ok) {
                isServerAvailable = true;
            } else {
                throw new Error(result.message || '비밀번호가 일치하지 않습니다.');
            }
        } else if (!response.ok) {
            throw new Error('로그인 실패');
        } else {
            console.warn('Server API not returning JSON (static host environment). Switching to local client mode.');
        }
    } catch (e) {
        if (e.message && (e.message.includes('비밀번호') || e.message.includes('일치하지 않습니다'))) {
            throw e;
        }
        console.warn('Server connection error, using local storage mode:', e);
    }
    
    if (isServerAvailable && result && result.success) {
        userItinerariesData = {
            travel: result.itineraries.travel || [],
            business: result.itineraries.business || [],
            custom: result.itineraries.custom || [],
            memo: result.itineraries.memo || []
        };
    } else {
        // Fallback for static host / GitHub Pages / local storage mode
        let storedUserPass = localStorage.getItem(`point_map_user_pass_${userId}`);
        if (storedUserPass && storedUserPass !== password) {
            throw new Error('비밀번호가 일치하지 않습니다.');
        }
        if (!storedUserPass) {
            localStorage.setItem(`point_map_user_pass_${userId}`, password);
        }
        
        ['travel', 'business', 'custom', 'memo'].forEach(mode => {
            const saved = localStorage.getItem(`point_map_itineraries_${mode}_${userId}`);
            if (saved) {
                try {
                    userItinerariesData[mode] = JSON.parse(saved);
                } catch (err) {
                    userItinerariesData[mode] = getSeedDataForMode(mode);
                }
            } else {
                userItinerariesData[mode] = getSeedDataForMode(mode);
            }
        });
        result = { success: true, itineraries: userItinerariesData };
    }
    
    let needsSave = false;
    ['travel', 'business', 'custom', 'memo'].forEach(mode => {
        if (!userItinerariesData[mode] || userItinerariesData[mode].length === 0) {
            userItinerariesData[mode] = getSeedDataForMode(mode);
            needsSave = true;
        }
    });
    
    if (needsSave && isServerAvailable) {
        await fetch(`/api/save?userId=${encodeURIComponent(userId)}&password=${encodeURIComponent(password)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(userItinerariesData)
        }).catch(err => console.warn('Background server save failed:', err));
    }
    
    return result;
}

async function handleLogin(userId, password) {
    const errorElement = document.getElementById('login-error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    const cleanId = (userId || '').replace(/\s+/g, '');
    const cleanPassword = (password || '').replace(/\s+/g, '');
    
    if (!cleanId || !cleanPassword) {
        if (errorElement) {
            errorElement.textContent = '아이디와 비밀번호를 모두 입력해 주세요.';
            errorElement.style.display = 'block';
        }
        return;
    }
    
    // Allow only English, Numbers, _, -
    const sanitizedId = cleanId.replace(/[^a-zA-Z0-9_\-]/g, '');
    if (sanitizedId !== cleanId) {
        if (errorElement) {
            errorElement.textContent = '아이디는 영문, 숫자, _, - 만 사용 가능합니다. (한글/공백/특수문자 불가)';
            errorElement.style.display = 'block';
        }
        return;
    }

    // Check if user exists first
    const exists = await checkUserExists(sanitizedId);
    if (!exists) {
        showConfirm(
            `<i class="fa-solid fa-user-plus" style="color: var(--primary-blue, #2196F3);"></i> 신규 계정 개설 안내`,
            `등록되지 않은 아이디(<strong>${sanitizedId}</strong>)입니다.<br>입력하신 정보로 신규 계정을 생성하시겠습니까?`,
            async () => {
                await executeLoginProcess(sanitizedId, cleanPassword, errorElement);
            }
        );
        return;
    }

    await executeLoginProcess(sanitizedId, cleanPassword, errorElement);
}

async function executeLoginProcess(sanitizedId, cleanPassword, errorElement) {
    try {
        showToast('로그인 중...');
        await loginAndLoadDataFromServer(sanitizedId, cleanPassword);
        
        PointMapStorage.setUserId(sanitizedId);
        PointMapStorage.setUserPassword(cleanPassword);
        
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('display-user-id').textContent = sanitizedId;
        document.getElementById('user-profile-badge').style.display = 'inline-flex';
        
        loadData();
        renderAll();
        
        const defaultIt = getCurrentItinerary();
        if (defaultIt && defaultIt.places.length > 0) {
            fitMapToPlaces(defaultIt.places);
        } else {
            map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        }
        
        showToast(`${sanitizedId}님, 환영합니다!`);
    } catch (err) {
        console.error(err);
        if (errorElement) {
            errorElement.textContent = err.message || '로그인 중 오류가 발생했습니다.';
            errorElement.style.display = 'block';
        }
        showToast('로그인에 실패했습니다.');
    }
}

function handleLogout() {
    PointMapStorage.setUserId('');
    PointMapStorage.setUserPassword('');
    localStorage.removeItem('point_map_user_id');
    localStorage.removeItem('point_map_user_password');
    
    userItinerariesData = {
        travel: [],
        business: [],
        custom: [],
        memo: []
    };
    itineraries = [];
    currentItineraryId = null;
    
    clearMap();
    
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('user-profile-badge').style.display = 'none';
    document.getElementById('login-username-input').value = '';
    document.getElementById('login-password-input').value = '';
    const errorElement = document.getElementById('login-error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    renderAll();
    showToast('로그아웃 되었습니다.');
}

function saveData() {
    const it = getCurrentItinerary();
    if (it) {
        it.updatedAt = new Date().toISOString();
    }
    userItinerariesData[currentMode] = itineraries;
    PointMapStorage.setCurrentItineraryId(currentMode, currentItineraryId);
    PointMapStorage.setCurrentMode(currentMode);
    saveAllDataToServer();
}

// --- Getters ---
function getCurrentItinerary() {
    return itineraries.find(it => it.id === currentItineraryId);
}

// --- Itinerary Operations ---
function selectItinerary(id) {
    if (itineraries.some(it => it.id === id)) {
        currentItineraryId = id;
        saveData();
        renderAll();
        
        const it = getCurrentItinerary();
        if (it && it.places.length > 0) {
            fitMapToPlaces(it.places);
        }
    }
}

function createItinerary(name, targetMode = currentMode) {
    const id = 'itinerary-' + Date.now();
    const deviceId = PointMapStorage.getDeviceId();
    const userId = PointMapStorage.getUserId();
    const now = new Date().toISOString();
    
    const newIt = {
        id: id,
        name: name,
        mode: targetMode,
        localUserId: deviceId,
        userId: userId,
        createdAt: now,
        updatedAt: now,
        places: []
    };
    
    if (targetMode === currentMode) {
        itineraries.push(newIt);
        currentItineraryId = id;
        saveData();
        renderAll();
        clearMap();
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    } else {
        // Fetch existing itineraries for the target mode
        let targetItineraries = PointMapStorage.loadItineraries(targetMode);
        targetItineraries.push(newIt);
        
        // Save to target mode's local storage keys
        PointMapStorage.saveItineraries(targetMode, targetItineraries);
        PointMapStorage.setCurrentItineraryId(targetMode, id);
        
        // Switch the active mode of the application to targetMode
        switchMode(targetMode);
    }
    
    showToast(`새 일정이 추가되었습니다.`);
}

function renameItinerary(newName) {
    const it = getCurrentItinerary();
    if (it) {
        it.name = newName;
        it.updatedAt = new Date().toISOString();
        saveData();
        renderItineraryDropdown();
    }
}

function deleteCurrentItinerary() {
    const it = getCurrentItinerary();
    if (!it) return;
    
    showConfirm(
        `<i class="fa-solid fa-trash-can" style="color: var(--danger-red, #f44336);"></i> 일정 삭제`,
        `'${it.name}' 일정을 정말로 삭제하시겠습니까?`,
        () => {
            itineraries = itineraries.filter(item => item.id !== currentItineraryId);
            if (itineraries.length === 0) {
                const deviceId = PointMapStorage.getDeviceId();
                const userId = PointMapStorage.getUserId();
                const now = new Date().toISOString();
                const newIt = {
                    id: 'itinerary-' + Date.now(),
                    name: `새 [${getModeName(currentMode)}] 일정`,
                    mode: currentMode,
                    localUserId: deviceId,
                    userId: userId,
                    createdAt: now,
                    updatedAt: now,
                    places: []
                };
                itineraries.push(newIt);
                currentItineraryId = newIt.id;
            } else {
                currentItineraryId = itineraries[0].id;
            }
            saveData();
            renderAll();
            
            const nextIt = getCurrentItinerary();
            if (nextIt && nextIt.places.length > 0) {
                fitMapToPlaces(nextIt.places);
            } else {
                map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
            }
            showToast(`일정이 삭제되었습니다.`);
        }
    );
}

// --- Place Operations ---
function addPlaceToCurrentItinerary(name, lat, lng) {
    const it = getCurrentItinerary();
    if (!it) return;
    openMemoModalForAdding(name, lat, lng);
}

function addPlaceToCurrentItineraryWithMemo(name, lat, lng, memoDate, memoTime, memoText) {
    const it = getCurrentItinerary();
    if (!it) return;
    
    const deviceId = PointMapStorage.getDeviceId();
    const userId = PointMapStorage.getUserId();
    const now = new Date().toISOString();
    
    const newPlace = {
        id: 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        name: name,
        lat: lat,
        lng: lng,
        memoDate: memoDate || '',
        memoTime: memoTime || '',
        memoText: memoText || '',
        transport: activeTravelMode || 'driving',
        localUserId: deviceId,
        userId: userId,
        createdAt: now,
        updatedAt: now
    };
    
    it.places.push(newPlace);
    saveData();
    renderAll();
    map.panTo([lat, lng]);
    showToast(`'${name}' 장소가 추가되었습니다.`);
    
    requestNotificationPermission();
    checkNotifications();
}

function deletePlace(placeId) {
    const it = getCurrentItinerary();
    if (!it) return;
    
    const place = it.places.find(p => p.id === placeId);
    if (!place) return;
    
    showConfirm(
        `<i class="fa-solid fa-trash-can" style="color: var(--danger-red, #f44336);"></i> 장소 삭제`,
        `'${place.name}' 장소를 일정에서 삭제하시겠습니까?`,
        () => {
            it.places = it.places.filter(p => p.id !== placeId);
            saveData();
            renderAll();
            if (it.places.length > 0) {
                fitMapToPlaces(it.places);
            } else {
                map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
            }
            showToast(`장소가 삭제되었습니다.`);
        }
    );
}

// --- Reorder Drag & Drop Logic ---
function movePlaceInList(draggedId, targetId) {
    const it = getCurrentItinerary();
    if (!it) return;
    
    const draggedIdx = it.places.findIndex(p => p.id === draggedId);
    const targetIdx = it.places.findIndex(p => p.id === targetId);
    
    if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) return;
    
    const [draggedItem] = it.places.splice(draggedIdx, 1);
    it.places.splice(targetIdx, 0, draggedItem);
    
    saveData();
    renderAll();
}

// --- Transfer Itinerary / Place Logic ---
function sendCurrentItineraryToMode(targetMode) {
    const currentIt = getCurrentItinerary();
    if (!currentIt) return;
    
    showConfirm(
        `<i class="fa-solid fa-share-nodes" style="color: var(--primary-blue);"></i> 일정 내보내기`,
        `현재 '${currentIt.name}' 일정을 [${getModeName(targetMode)}] 모드로 복사하시겠습니까?`,
        () => {
            let targetItineraries = getItinerariesForMode(targetMode);
            
            const deviceId = PointMapStorage.getDeviceId();
            const userId = PointMapStorage.getUserId();
            const now = new Date().toISOString();
            
            const copiedIt = {
                id: 'itinerary-' + Date.now(),
                name: currentIt.name + ' (복사본)',
                mode: targetMode,
                localUserId: deviceId,
                userId: userId,
                createdAt: now,
                updatedAt: now,
                places: currentIt.places.map(p => ({
                    id: 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                    name: p.name,
                    lat: p.lat,
                    lng: p.lng,
                    memoDate: p.memoDate || '',
                    memoTime: p.memoTime || '',
                    memoText: p.memoText || '',
                    transport: p.transport || 'driving',
                    localUserId: deviceId,
                    userId: userId,
                    createdAt: now,
                    updatedAt: now
                }))
            };
            targetItineraries.push(copiedIt);
            
            PointMapStorage.saveItineraries(targetMode, targetItineraries);
            showToast(`'${currentIt.name}' 일정이 [${getModeName(targetMode)}] 모드로 복사되었습니다.`);
        }
    );
}

function sendPlaceToMode(place, targetMode) {
    let targetItineraries = getItinerariesForMode(targetMode);
    if (targetItineraries.length === 0) {
        showToast(`[${getModeName(targetMode)}] 모드에 일정이 없습니다. 새 일정을 먼저 생성해 주세요.`);
        return;
    }
    
    const targetId = PointMapStorage.getCurrentItineraryId(targetMode) || targetItineraries[0].id;
    let targetIt = targetItineraries.find(it => it.id === targetId) || targetItineraries[0];
    
    const deviceId = PointMapStorage.getDeviceId();
    const userId = PointMapStorage.getUserId();
    const now = new Date().toISOString();
    
    const copiedPlace = {
        id: 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        memoDate: place.memoDate || '',
        memoTime: place.memoTime || '',
        memoText: place.memoText || '',
        transport: place.transport || 'driving',
        localUserId: deviceId,
        userId: userId,
        createdAt: now,
        updatedAt: now
    };
    
    targetIt.places.push(copiedPlace);
    PointMapStorage.saveItineraries(targetMode, targetItineraries);
    showToast(`'${place.name}'이(가) [${getModeName(targetMode)}] 모드의 '${targetIt.name}' 일정에 추가되었습니다.`);
}

function addPlaceToTargetItinerary(place, targetMode, targetItineraryId) {
    let targetItineraries = getItinerariesForMode(targetMode);
    let targetIt = targetItineraries.find(it => it.id === targetItineraryId);
    
    if (targetIt) {
        const deviceId = PointMapStorage.getDeviceId();
        const userId = PointMapStorage.getUserId();
        const now = new Date().toISOString();
        
        const copiedPlace = {
            id: 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            memoDate: place.memoDate || '',
            memoTime: place.memoTime || '',
            memoText: place.memoText || '',
            transport: place.transport || 'driving',
            localUserId: deviceId,
            userId: userId,
            createdAt: now,
            updatedAt: now
        };
        targetIt.places.push(copiedPlace);
        PointMapStorage.saveItineraries(targetMode, targetItineraries);
        showToast(`'${place.name}' 장소가 [${getModeName(targetMode)}] 모드의 '${targetIt.name}' 일정에 추가되었습니다.`);
    }
}

// --- Map Render Helpers ---
function clearMap() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
    if (previewMarker) {
        map.removeLayer(previewMarker);
        previewMarker = null;
    }
}

function updateMap() {
    clearMap();
    
    const it = getCurrentItinerary();
    if (!it || it.places.length === 0) return;
    
    const latlngs = [];
    
    it.places.forEach((place, index) => {
        const placeNum = index + 1;
        
        let markerColorClass = 'marker-pin';
        if (currentMode === 'business') markerColorClass = 'marker-pin pin-business';
        else if (currentMode === 'custom') markerColorClass = 'marker-pin pin-custom';
        else if (currentMode === 'memo') markerColorClass = 'marker-pin pin-memo';
        else if (index === 0) markerColorClass = 'marker-pin pin-start';
        
        const iconHtml = `
            <div class="${markerColorClass}">
                <span class="marker-number">${placeNum}</span>
            </div>
        `;
        
        const customIcon = L.divIcon({
            className: 'custom-map-marker',
            html: iconHtml,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });
        
        const popupContent = `
            <div class="map-memo-bubble-wrapper">
                <div class="map-memo-header">
                    <span class="map-memo-title">${place.name}</span>
                    <button class="btn-edit-memo-popup" onclick="event.stopPropagation(); window.openMemoModal('${place.id}')" title="메모 수정">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </div>
                <div class="map-memo-body">
                    <div class="map-memo-meta">
                        <span><i class="fa-regular fa-calendar"></i> ${formatDateWithDay(place.memoDate)}</span>
                        <span><i class="fa-regular fa-clock"></i> ${place.memoTime || '시간 미정'}</span>
                    </div>
                    <div class="map-memo-content">${place.memoText || '작성된 메모가 없습니다.'}</div>
                </div>
            </div>
        `;
        
        const marker = L.marker([place.lat, place.lng], { icon: customIcon })
            .addTo(map)
            .bindPopup(popupContent, {
                className: 'custom-memo-popup',
                closeButton: false
            });
            
        marker.on('popupopen', () => {
            activeMemoPlaceId = place.id;
            document.querySelectorAll('.place-card').forEach(card => {
                card.classList.remove('has-open-memo');
            });
            const parentCard = document.querySelector(`.place-card[data-id="${place.id}"]`);
            if (parentCard) {
                parentCard.classList.add('has-open-memo');
            }
        });
        
        marker.on('popupclose', () => {
            if (activeMemoPlaceId === place.id) {
                activeMemoPlaceId = null;
                const parentCard = document.querySelector(`.place-card[data-id="${place.id}"]`);
                if (parentCard) {
                    parentCard.classList.remove('has-open-memo');
                }
            }
        });
            
        markers.push(marker);
        latlngs.push([place.lat, place.lng]);
    });
    
    // Draw connecting lines if NOT in Memo mode
    const polylineCoords = (currentMode !== 'memo' && routeCoordinates.length > 1) ? routeCoordinates : latlngs;
    if (currentMode !== 'memo' && polylineCoords.length > 1) {
        let routeColor = '#2196F3';
        if (currentMode === 'business') routeColor = '#a855f7';
        else if (currentMode === 'custom') routeColor = '#4CAF50';
        
        let polylineOptions = {
            color: routeColor,
            weight: 5,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round'
        };
        
        if (activeTravelMode === 'walking') {
            polylineOptions.dashArray = '5, 8';
        } else if (activeTravelMode === 'transit') {
            polylineOptions.dashArray = '1, 10';
            polylineOptions.weight = 6;
        }
        
        routeLine = L.polyline(polylineCoords, polylineOptions).addTo(map);
    }
}

function fitMapToPlaces(places) {
    if (!places || places.length === 0) return;
    const bounds = L.latLngBounds(places.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
}

// --- Distance Calculation ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// --- Routing & Directions Logic ---
let currentRouteRequestId = 0;

function calculateTaxiFare(meters) {
    if (meters <= 1600) return 4800;
    const additionalMeters = meters - 1600;
    const fare = 4800 + Math.ceil(additionalMeters / 131) * 100;
    return Math.round(fare / 100) * 100;
}

function decodeGooglePolyline(encoded) {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
}

async function fetchGoogleRoute(places, travelMode, apiKey) {
    const legs = [];
    let coordinates = [];
    
    for (let i = 0; i < places.length - 1; i++) {
        const legMode = places[i].transport || travelMode;
        let googleMode = 'driving';
        if (legMode === 'walking') googleMode = 'walking';
        else if (legMode === 'transit') googleMode = 'transit';
        
        const origin = `${places[i].lat},${places[i].lng}`;
        const destination = `${places[i+1].lat},${places[i+1].lng}`;
        
        const url = `/api/directions?origin=${origin}&destination=${destination}&mode=${googleMode}&key=${apiKey}`;
        const res = await fetch(url);
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
            throw new Error("Google directions API proxy unavailable");
        }
        
        const data = await res.json();
        if (data.status !== 'OK') {
            throw new Error("Google Maps API error: " + data.status);
        }
        
        const route = data.routes[0];
        const leg = route.legs[0];
        legs.push({
            distance: leg.distance.value,
            duration: leg.duration.value
        });
        
        const legCoords = decodeGooglePolyline(route.overview_polyline.points);
        coordinates = coordinates.concat(legCoords);
    }
    
    return { legs, coordinates };
}

async function fetchOSRMRoute(places, travelMode) {
    const legs = [];
    let coordinates = [];
    
    for (let i = 0; i < places.length - 1; i++) {
        const legMode = places[i].transport || travelMode;
        let profile = 'driving';
        if (legMode === 'walking') profile = 'foot';
        if (legMode === 'transit') profile = 'driving';
        
        const url = `https://router.project-osrm.org/route/v1/${profile}/${places[i].lng},${places[i].lat};${places[i+1].lng},${places[i+1].lat}?overview=full&geometries=geojson`;
        
        const res = await fetch(url);
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) throw new Error("OSRM API call failed");
        
        const data = await res.json();
        if (data.code !== 'Ok') throw new Error("OSRM returned error: " + data.code);
        
        const route = data.routes[0];
        const leg = route.legs[0];
        
        let duration = leg.duration;
        if (legMode === 'transit') {
            duration = leg.duration * 1.5 + 300;
        }
        
        legs.push({
            distance: leg.distance,
            duration: duration
        });
        
        const legCoords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        coordinates = coordinates.concat(legCoords);
    }
    
    return { legs, coordinates };
}

function generateStraightLineLegs(places) {
    const legs = [];
    for (let i = 0; i < places.length - 1; i++) {
        const p1 = places[i];
        const p2 = places[i+1];
        const dist = getDistance(p1.lat, p1.lng, p2.lat, p2.lng) * 1000;
        
        const legMode = p1.transport || activeTravelMode;
        let speed = 12.0;
        if (legMode === 'walking') speed = 1.4;
        else if (legMode === 'transit') speed = 8.3;
        
        legs.push({
            distance: dist,
            duration: dist / speed
        });
    }
    return legs;
}

async function updateRoute() {
    const it = getCurrentItinerary();
    if (!it || it.places.length < 2) {
        routeLegs = [];
        routeCoordinates = [];
        renderPlacesList();
        updateMap();
        calculateRouteSummary();
        return;
    }
    
    routeSummary.innerHTML = `경로 계산 중... <i class="fa-solid fa-spinner fa-spin"></i>`;
    
    const requestId = ++currentRouteRequestId;
    const apiKey = localStorage.getItem('google_maps_api_key') || '';
    
    try {
        let result;
        if (apiKey) {
            result = await fetchGoogleRoute(it.places, activeTravelMode, apiKey);
        } else {
            result = await fetchOSRMRoute(it.places, activeTravelMode);
        }
        
        if (requestId !== currentRouteRequestId) return;
        
        routeLegs = result.legs;
        routeCoordinates = result.coordinates;
        
        renderPlacesList();
        updateMap();
        calculateRouteSummary();
    } catch (err) {
        console.error("Routing error:", err);
        if (requestId !== currentRouteRequestId) return;
        
        routeLegs = generateStraightLineLegs(it.places);
        routeCoordinates = it.places.map(p => [p.lat, p.lng]);
        
        renderPlacesList();
        updateMap();
        calculateRouteSummary();
        
        if (apiKey) {
            showToast("Google Maps API 요청 실패. OSRM fallback으로 경로를 표시합니다.");
        }
    }
}

function selectRouteMode(mode) {
    if (activeTravelMode === mode) return;
    activeTravelMode = mode;
    localStorage.setItem('point_map_active_travel_mode', mode);
    
    document.querySelectorAll('.route-mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    updateRoute();
}

function calculateRouteSummary() {
    const it = getCurrentItinerary();
    if (!it || it.places.length === 0) {
        routeSummary.textContent = "계획된 동선이 없습니다.";
        return;
    }
    
    if (currentMode === 'memo') {
        routeSummary.innerHTML = `자유 메모 보관함 | 총 <strong style="color: #eab308;">${it.places.length}개</strong>의 장소가 저장되어 있습니다.`;
        return;
    }
    
    if (it.places.length <= 1) {
        routeSummary.textContent = "최소 2개 이상의 장소를 등록해야 이동선이 표시됩니다.";
        return;
    }
    
    let totalDist = 0;
    let totalDuration = 0;
    
    if (routeLegs && routeLegs.length > 0) {
        routeLegs.forEach(leg => {
            totalDist += leg.distance;
            totalDuration += leg.duration;
        });
    } else {
        // Fallback straight lines
        for (let i = 0; i < it.places.length - 1; i++) {
            totalDist += getDistance(it.places[i].lat, it.places[i].lng, it.places[i+1].lat, it.places[i+1].lng) * 1000;
        }
        // Approximate duration (avg speed ~43km/h)
        totalDuration = totalDist / 12.0;
    }
    
    // Format distance in km
    const totalDistKm = (totalDist / 1000).toFixed(1);
    
    // Format duration
    let durationText = '';
    const totalMinutes = Math.round(totalDuration / 60);
    if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        durationText = `${hours}시간 ${mins}분`;
    } else {
        durationText = `${totalMinutes}분`;
    }
    
    let colorClass = 'var(--primary-blue)';
    if (currentMode === 'business') colorClass = '#a855f7';
    else if (currentMode === 'custom') colorClass = 'var(--primary-green)';
    
    let modeText = '이동';
    let extraText = '';
    if (activeTravelMode === 'walking') {
        modeText = '도보';
    } else if (activeTravelMode === 'transit') {
        modeText = '대중교통';
    } else if (activeTravelMode === 'driving') {
        modeText = '자동차/택시';
        const taxiFare = calculateTaxiFare(totalDist);
        extraText = ` (택시비 약 ${taxiFare.toLocaleString()}원)`;
    }
    
    routeSummary.innerHTML = `총 <strong style="color: ${colorClass};">${it.places.length}개</strong> 장소 | ${modeText} <strong style="color: var(--primary-green);">${totalDistKm} km</strong> | <strong style="color: var(--primary-green);">${durationText}</strong> 소요${extraText}`;
}

// --- Place Search ---
async function searchPlaces(query) {
    if (!query || query.trim() === '') {
        hideSearchResults();
        return;
    }
    
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&countrycodes=kr`);
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) {
            throw new Error("Search API unavailable");
        }
        const data = await response.json();
        
        if (data && data.length > 0) {
            displaySearchResults(data);
        } else {
            searchResultsList.innerHTML = `<li class="search-result-item" style="color:var(--text-muted);cursor:default;">검색 결과가 없습니다.</li>`;
            searchResultsList.style.display = 'block';
        }
    } catch (e) {
        console.error("Search API failure: ", e);
        searchResultsList.innerHTML = `<li class="search-result-item" style="color:var(--text-muted);cursor:default;">네트워크 오류가 발생했습니다.</li>`;
        searchResultsList.style.display = 'block';
    }
}

function displaySearchResults(results) {
    searchResultsList.innerHTML = '';
    
    results.forEach(res => {
        const li = document.createElement('li');
        li.className = 'search-result-item';
        
        const displayName = res.display_name.split(',');
        const mainTitle = displayName[0] || '알 수 없는 곳';
        const addressDetails = displayName.slice(1).join(',').trim();
        const lat = parseFloat(res.lat);
        const lng = parseFloat(res.lon);
        
        li.innerHTML = `
            <i class="fa-solid fa-location-dot result-icon"></i>
            <div class="result-info">
                <span class="result-name">${mainTitle}</span>
                <span class="result-address">${addressDetails || '대한민국'}</span>
            </div>
        `;
        
        li.addEventListener('click', () => {
            showPreviewMarker(mainTitle, lat, lng, addressDetails);
            hideSearchResults();
            searchInput.value = '';
            btnClearSearch.style.display = 'none';
        });
        
        searchResultsList.appendChild(li);
    });
    
    searchResultsList.style.display = 'block';
}

function hideSearchResults() {
    searchResultsList.style.display = 'none';
}

// --- Render Dropdowns & Lists ---
function renderItineraryDropdown() {
    itinerarySelect.innerHTML = '';
    itineraries.forEach(it => {
        const opt = document.createElement('option');
        opt.value = it.id;
        opt.textContent = it.name;
        if (it.id === currentItineraryId) {
            opt.selected = true;
        }
        itinerarySelect.appendChild(opt);
    });
}

function renderPlacesList() {
    placeCardsList.innerHTML = '';
    const it = getCurrentItinerary();
    
    if (!it || it.places.length === 0) {
        emptyState.style.display = 'flex';
        placeCountBadge.textContent = '0';
        return;
    }
    
    emptyState.style.display = 'none';
    placeCountBadge.textContent = it.places.length.toString();
    
    it.places.forEach((place, index) => {
        const li = document.createElement('li');
        const placeNum = index + 1;
        
        let cardModeClass = '';
        if (currentMode === 'business') cardModeClass = 'card-business';
        else if (currentMode === 'custom') cardModeClass = 'card-custom';
        else if (currentMode === 'memo') cardModeClass = 'card-memo';
        else if (index === 0) cardModeClass = 'start-point';
        
        li.className = `place-card ${cardModeClass}`;
        li.setAttribute('data-id', place.id);
        
        if (place.id === editingPlaceId) {
            // Render Inline Editing Form
            li.innerHTML = `
                <div class="place-card-edit-form" onclick="event.stopPropagation();">
                    <div class="edit-input-group">
                        <label>장소명</label>
                        <input type="text" class="edit-place-name" value="${place.name || ''}" placeholder="장소명">
                    </div>
                    
                    <div class="edit-input-group">
                        <label>메모</label>
                        <textarea class="edit-place-memo" placeholder="메모 내용">${place.memoText || ''}</textarea>
                    </div>
                    
                    <div class="edit-row">
                        <div class="edit-input-group">
                            <label>날짜</label>
                            <input type="date" class="edit-place-date" value="${place.memoDate || ''}">
                        </div>
                        <div class="edit-input-group">
                            <label>시간</label>
                            <input type="time" class="edit-place-time" value="${place.memoTime || ''}">
                        </div>
                    </div>
                    
                    <div class="edit-input-group">
                        <label>이동수단</label>
                        <select class="edit-place-transport">
                            <option value="walking" ${place.transport === 'walking' ? 'selected' : ''}>도보</option>
                            <option value="transit" ${place.transport === 'transit' ? 'selected' : ''}>대중교통</option>
                            <option value="driving" ${place.transport === 'driving' ? 'selected' : ''}>자동차/택시</option>
                        </select>
                    </div>
                    
                    <div class="edit-form-actions">
                        <button type="button" class="btn-edit-cancel">취소</button>
                        <button type="button" class="btn-edit-save">저장</button>
                    </div>
                </div>
            `;
            
            // Bind actions for edit form
            li.querySelector('.btn-edit-cancel').addEventListener('click', (e) => {
                e.stopPropagation();
                editingPlaceId = null;
                renderPlacesList();
            });
            
            li.querySelector('.btn-edit-save').addEventListener('click', (e) => {
                e.stopPropagation();
                const editName = li.querySelector('.edit-place-name').value.trim() || place.name;
                const editMemo = li.querySelector('.edit-place-memo').value.trim();
                const editDate = li.querySelector('.edit-place-date').value;
                const editTime = li.querySelector('.edit-place-time').value;
                const editTransport = li.querySelector('.edit-place-transport').value;
                
                place.name = editName;
                place.memoText = editMemo;
                place.memoDate = editDate;
                place.memoTime = editTime;
                place.transport = editTransport;
                place.updatedAt = new Date().toISOString();
                
                editingPlaceId = null;
                saveData();
                renderAll();
                showToast('일정이 수정되었습니다.');
            });
            
        } else {
            // Build Action Buttons
            let actionsHtml = '';
            if (currentMode === 'memo') {
                actionsHtml = `
                    <button class="btn-card-action btn-add-route" title="일정에 추가">
                        <i class="fa-solid fa-calendar-plus"></i>
                    </button>
                    <button class="btn-card-action btn-card-delete" title="장소 삭제">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                `;
            } else {
                actionsHtml = `
                    <button class="btn-card-action btn-send-to" title="다른 모드로 보내기">
                        <i class="fa-solid fa-share-nodes"></i>
                    </button>
                    <button class="btn-card-action btn-card-delete" title="장소 삭제">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                `;
            }
            
            li.innerHTML = `
                <div class="card-badge">
                    ${placeNum}
                </div>
                <div class="card-content">
                    <h4 class="card-title">${place.name}</h4>
                    <span class="card-coords">${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}</span>
                </div>
                <div class="card-actions">${actionsHtml}</div>
            `;
            
            // Add specific event bindings
            if (currentMode === 'memo') {
                const btnAddRoute = li.querySelector('.btn-add-route');
                if (btnAddRoute) {
                    btnAddRoute.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openExportModal('place', place);
                    });
                }
            } else {
                const btnSendTo = li.querySelector('.btn-send-to');
                if (btnSendTo) {
                    btnSendTo.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openExportModal('place', place);
                    });
                }
            }
            
            li.querySelector('.btn-card-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deletePlace(place.id);
            });
            
            // Native HTML5 Drag and Drop event listeners
            if (currentMode !== 'memo') {
                li.setAttribute('draggable', 'true');
                
                li.addEventListener('dragstart', (e) => {
                    li.classList.add('dragging');
                    e.dataTransfer.setData('text/plain', place.id);
                    e.dataTransfer.effectAllowed = 'move';
                });
                
                li.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    li.classList.add('drag-over');
                });
                
                li.addEventListener('dragleave', () => {
                    li.classList.remove('drag-over');
                });
                
                li.addEventListener('dragend', () => {
                    li.classList.remove('dragging');
                    document.querySelectorAll('.place-card').forEach(card => card.classList.remove('drag-over'));
                });
                
                li.addEventListener('drop', (e) => {
                    e.preventDefault();
                    li.classList.remove('drag-over');
                    const draggedId = e.dataTransfer.getData('text/plain');
                    const targetId = place.id;
                    movePlaceInList(draggedId, targetId);
                });
            }
            
            // Card badge click toggles the marker popup
            const badgeEl = li.querySelector('.card-badge');
            badgeEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const markerIdx = index;
                if (markers[markerIdx]) {
                    if (markers[markerIdx].isPopupOpen()) {
                        markers[markerIdx].closePopup();
                    } else {
                        map.panTo([place.lat, place.lng]);
                        markers[markerIdx].openPopup();
                    }
                }
            });
            
            // Map pan to card location on click, and trigger edit mode
            li.addEventListener('click', (e) => {
                // Ignore clicks on buttons/badge
                if (e.target.closest('.btn-card-action') || e.target.closest('.card-badge')) return;
                
                // Pan map
                map.panTo([place.lat, place.lng]);
                const markerIdx = index;
                if (markers[markerIdx]) {
                    markers[markerIdx].openPopup();
                }
                
                // Enter inline edit mode
                editingPlaceId = place.id;
                renderPlacesList();
            });
        }
        
        placeCardsList.appendChild(li);
    });
}

function renderAll() {
    renderItineraryDropdown();
    updateRoute();
}

// --- Modals Handlers ---
function openModal(action) {
    modalAction = action;
    modalErrorMessage.style.display = 'none';
    itineraryNameInput.classList.remove('error');
    
    const modeSelectContainer = document.getElementById('itinerary-mode-select-container');
    
    if (action === 'create') {
        modalTitle.textContent = `새 일정 만들기`;
        itineraryNameInput.value = '';
        if (modeSelectContainer) {
            modeSelectContainer.style.display = 'block';
            itineraryModeSelect.value = currentMode;
        }
    } else {
        modalTitle.textContent = '일정 이름 변경';
        const it = getCurrentItinerary();
        itineraryNameInput.value = it ? it.name : '';
        if (modeSelectContainer) {
            modeSelectContainer.style.display = 'none';
        }
    }
    
    itineraryModal.style.display = 'flex';
    itineraryNameInput.focus();
}

// Custom confirmation modal styles to dynamically match theme colors
function updateConfirmModalTheme() {
    let themeColor = 'var(--primary-blue, #2196F3)';
    if (currentMode === 'business') themeColor = '#a855f7';
    else if (currentMode === 'custom') themeColor = 'var(--primary-green, #4CAF50)';
    else if (currentMode === 'memo') themeColor = '#eab308';
    
    confirmTitle.style.color = themeColor;
    btnConfirmYes.style.backgroundColor = themeColor;
    btnConfirmYes.style.borderColor = themeColor;
}

function closeModal() {
    itineraryModal.style.display = 'none';
}

// --- Memo Modal Handlers ---
function closeMemoModal() {
    memoModal.style.display = 'none';
}

window.closeMemoModal = closeMemoModal;

window.openMemoModal = function(placeId) {
    const it = getCurrentItinerary();
    if (!it) return;
    
    const place = it.places.find(p => p.id === placeId);
    if (!place) return;
    
    // Hide itinerary selection section when editing
    if (memoItinerarySelectSection) {
        memoItinerarySelectSection.style.display = 'none';
    }
    
    // Set form fields
    memoPlaceName.value = place.name;
    memoDateInput.value = place.memoDate || '';
    memoTimeInput.value = place.memoTime || '';
    memoTextInput.value = place.memoText || '';
    
    // Update Modal title and styles
    memoModalTitle.textContent = '장소 일정 및 메모 수정';
    
    // Dynamically update save button theme color
    let themeColor = 'var(--primary-blue, #2196F3)';
    if (currentMode === 'business') themeColor = '#a855f7';
    else if (currentMode === 'custom') themeColor = 'var(--primary-green, #4CAF50)';
    else if (currentMode === 'memo') themeColor = '#eab308';
    btnMemoSave.style.backgroundColor = themeColor;
    btnMemoSave.style.borderColor = themeColor;
    
    const btnSave = document.getElementById('btn-memo-save');
    const newBtnSave = btnSave.cloneNode(true);
    btnSave.parentNode.replaceChild(newBtnSave, btnSave);
    
    newBtnSave.addEventListener('click', () => {
        place.name = memoPlaceName.value.trim() || place.name;
        place.memoDate = memoDateInput.value;
        place.memoTime = memoTimeInput.value;
        place.memoText = memoTextInput.value.trim();
        place.updatedAt = new Date().toISOString();
        
        saveData();
        renderAll();
        closeMemoModal();
        showToast('메모가 저장되었습니다.');
        
        requestNotificationPermission();
        checkNotifications();
    });
    
    memoModal.style.display = 'flex';
};

window.openMemoModalForAdding = function(name, lat, lng) {
    // Show itinerary selection section when adding
    if (memoItinerarySelectSection) {
        memoItinerarySelectSection.style.display = 'flex';
    }
    
    // Check if there are existing itineraries
    if (itineraries && itineraries.length > 0) {
        memoTargetExisting.disabled = false;
        memoTargetExisting.checked = true;
        memoTargetExistingContainer.style.display = 'block';
        memoTargetNewContainer.style.display = 'none';
        
        memoTargetExistingSelect.innerHTML = itineraries.map(it => `
            <option value="${it.id}" ${it.id === currentItineraryId ? 'selected' : ''}>${it.name}</option>
        `).join('');
    } else {
        memoTargetExisting.disabled = true;
        memoTargetExisting.checked = false;
        memoTargetNew.checked = true;
        memoTargetExistingContainer.style.display = 'none';
        memoTargetNewContainer.style.display = 'flex';
    }
    
    memoTargetNewName.value = `새 [${getModeName(currentMode)}] 일정`;
    memoTargetNewMode.value = currentMode;
    
    // Set form fields
    memoPlaceName.value = name;
    
    // Default date input to today's date in local time
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    memoDateInput.value = `${yyyy}-${mm}-${dd}`;
    
    memoTimeInput.value = '';
    memoTextInput.value = '';
    
    // Update Modal title
    memoModalTitle.textContent = '장소 일정 및 메모 추가';
    
    // Dynamically update save button theme color
    let themeColor = 'var(--primary-blue, #2196F3)';
    if (currentMode === 'business') themeColor = '#a855f7';
    else if (currentMode === 'custom') themeColor = 'var(--primary-green, #4CAF50)';
    else if (currentMode === 'memo') themeColor = '#eab308';
    btnMemoSave.style.backgroundColor = themeColor;
    btnMemoSave.style.borderColor = themeColor;
    
    const btnSave = document.getElementById('btn-memo-save');
    const newBtnSave = btnSave.cloneNode(true);
    btnSave.parentNode.replaceChild(newBtnSave, btnSave);
    
    newBtnSave.addEventListener('click', () => {
        const inputName = memoPlaceName.value.trim() || name;
        const memoDate = memoDateInput.value;
        const memoTime = memoTimeInput.value;
        const memoText = memoTextInput.value.trim();
        
        const deviceId = PointMapStorage.getDeviceId();
        const userId = PointMapStorage.getUserId();
        const now = new Date().toISOString();
        
        const newPlace = {
            id: 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            name: inputName,
            lat: lat,
            lng: lng,
            memoDate: memoDate || '',
            memoTime: memoTime || '',
            memoText: memoText || '',
            transport: activeTravelMode || 'driving',
            localUserId: deviceId,
            userId: userId,
            createdAt: now,
            updatedAt: now
        };
        
        const targetType = document.querySelector('input[name="memo-target-type"]:checked').value;
        if (targetType === 'existing') {
            const targetItId = memoTargetExistingSelect.value;
            const targetIt = itineraries.find(it => it.id === targetItId);
            if (targetIt) {
                targetIt.places.push(newPlace);
                currentItineraryId = targetItId;
                saveData();
                renderAll();
                map.panTo([lat, lng]);
                showToast(`'${inputName}' 장소가 추가되었습니다.`);
            }
        } else {
            const newItName = memoTargetNewName.value.trim() || '새 일정';
            const newItMode = memoTargetNewMode.value;
            
            const newItId = 'itinerary-' + Date.now();
            const newIt = {
                id: newItId,
                name: newItName,
                mode: newItMode,
                localUserId: deviceId,
                userId: userId,
                createdAt: now,
                updatedAt: now,
                places: [newPlace]
            };
            
            if (newItMode === currentMode) {
                itineraries.push(newIt);
                currentItineraryId = newItId;
                saveData();
                renderAll();
                map.panTo([lat, lng]);
            } else {
                let targetItineraries = PointMapStorage.loadItineraries(newItMode);
                targetItineraries.push(newIt);
                PointMapStorage.saveItineraries(newItMode, targetItineraries);
                PointMapStorage.setCurrentItineraryId(newItMode, newItId);
                
                switchMode(newItMode);
                map.panTo([lat, lng]);
            }
            showToast(`'${inputName}' 장소와 함께 새 일정이 추가되었습니다.`);
        }
        
        closeMemoModal();
        requestNotificationPermission();
        checkNotifications();
    });
    
    memoModal.style.display = 'flex';
};

// --- Notifications Logic ---
function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showToast('알림 권한이 허용되었습니다.');
                }
            });
        }
    }
}

function checkNotifications() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    const now = new Date();
    let shownList = JSON.parse(localStorage.getItem('point_map_shown_notifications') || '[]');
    let modified = false;
    
    ['travel', 'business', 'custom', 'memo'].forEach(mode => {
        const saved = localStorage.getItem(`point_map_itineraries_${mode}`);
        if (!saved) return;
        
        try {
            const its = JSON.parse(saved);
            its.forEach(it => {
                it.places.forEach(place => {
                    if (place.memoDate && place.memoTime) {
                        const visitTime = new Date(`${place.memoDate}T${place.memoTime}`);
                        const oneDayBefore = new Date(visitTime.getTime() - 24 * 60 * 60 * 1000);
                        
                        // Check if alert time has passed, but visit time has not passed
                        if (now >= oneDayBefore && now < visitTime) {
                            const notificationKey = `${place.id}_alert`;
                            if (!shownList.includes(notificationKey)) {
                                new Notification(`[일정 알림] 내일 방문 예정`, {
                                    body: `장소: ${place.name}\n시간: ${place.memoDate} ${place.memoTime}\n메모: ${place.memoText || '내용 없음'}`,
                                    tag: notificationKey
                                });
                                shownList.push(notificationKey);
                                modified = true;
                            }
                        }
                    }
                });
            });
        } catch (e) {
            console.error('Error parsing itineraries for notification check:', e);
        }
    });
    
    if (modified) {
        localStorage.setItem('point_map_shown_notifications', JSON.stringify(shownList));
    }
}

// Check for duplicate names
function handleModalSubmit() {
    const val = itineraryNameInput.value.trim();
    if (val === '') {
        modalErrorMessage.style.display = 'block';
        itineraryNameInput.classList.add('error');
        return;
    }
    
    if (modalAction === 'create') {
        const targetMode = itineraryModeSelect ? itineraryModeSelect.value : currentMode;
        createItinerary(val, targetMode);
    } else {
        renameItinerary(val);
    }
    closeModal();
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    try {
        // Login Overlay Events
        const btnLoginSubmit = document.getElementById('btn-login-submit');
        if (btnLoginSubmit) {
            btnLoginSubmit.addEventListener('click', (e) => {
                e.preventDefault();
                const usernameInput = document.getElementById('login-username-input');
                const passwordInput = document.getElementById('login-password-input');
                handleLogin(usernameInput.value, passwordInput.value);
            });
        }

        const loginUsernameInput = document.getElementById('login-username-input');
        const loginPasswordInput = document.getElementById('login-password-input');
        
        if (loginUsernameInput) {
            loginUsernameInput.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.code === 'Space' || e.keyCode === 32) {
                    e.preventDefault();
                    return false;
                }
                if (e.key === 'Enter') {
                    if (loginPasswordInput) loginPasswordInput.focus();
                }
            });
            loginUsernameInput.addEventListener('input', (e) => {
                if (e.target.value.includes(' ')) {
                    e.target.value = e.target.value.replace(/\s+/g, '');
                }
            });
        }

        if (loginPasswordInput) {
            loginPasswordInput.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.code === 'Space' || e.keyCode === 32) {
                    e.preventDefault();
                    return false;
                }
                if (e.key === 'Enter') {
                    handleLogin(loginUsernameInput.value, loginPasswordInput.value);
                }
            });
            loginPasswordInput.addEventListener('input', (e) => {
                if (e.target.value.includes(' ')) {
                    e.target.value = e.target.value.replace(/\s+/g, '');
                }
            });
        }
    } catch (err) {
        console.error('Error binding login listeners:', err);
    }

    // Logout Header Button
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', handleLogout);
    }

    // Mode tabs binding
    document.getElementById('mode-travel').addEventListener('click', () => switchMode('travel'));
    document.getElementById('mode-business').addEventListener('click', () => switchMode('business'));
    document.getElementById('mode-custom').addEventListener('click', () => switchMode('custom'));
    document.getElementById('mode-memo').addEventListener('click', () => switchMode('memo'));
    
    // Dropdown change
    itinerarySelect.addEventListener('change', (e) => {
        selectItinerary(e.target.value);
    });
    
    // New Itinerary Button
    btnNewItinerary.addEventListener('click', () => openModal('create'));
    
    // Rename Itinerary Button
    btnRenameItinerary.addEventListener('click', () => openModal('rename'));
    
    // Delete Itinerary Button
    btnDeleteItinerary.addEventListener('click', deleteCurrentItinerary);
    
    // Send Itinerary (Share) menu toggles
    btnSendItinerary.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentIt = getCurrentItinerary();
        if (currentIt) {
            openExportModal('itinerary', currentIt);
        }
    });
    
    // Search Autocomplete Events
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.trim() !== '') {
            btnClearSearch.style.display = 'block';
        } else {
            btnClearSearch.style.display = 'none';
        }
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchPlaces(val);
        }, 400);
    });
    
    btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        btnClearSearch.style.display = 'none';
        hideSearchResults();
        searchInput.focus();
    });
    
    // Close search suggestions and dropdowns on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            hideSearchResults();
        }
        if (!e.target.closest('.dropdown-wrapper')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
            document.querySelectorAll('.place-card').forEach(card => {
                card.classList.remove('has-open-dropdown');
            });
        }
        if (!e.target.closest('.card-badge') && !e.target.closest('.leaflet-interactive') && !e.target.closest('.custom-memo-popup') && !e.target.closest('.memo-modal')) {
            activeMemoPlaceId = null;
            document.querySelectorAll('.card-memo-bubble').forEach(bubble => {
                bubble.classList.remove('show');
            });
        }
    });
    
    // Modal buttons
    btnModalCancel.addEventListener('click', closeModal);
    btnModalSave.addEventListener('click', handleModalSubmit);
    
    // Memo Modal Cancel
    btnMemoCancel.addEventListener('click', closeMemoModal);
    
    // Export Modal buttons
    btnExportCancel.addEventListener('click', closeExportModal);
    btnExportSubmit.addEventListener('click', executeExport);
    
    exportTypeExisting.addEventListener('change', () => {
        exportExistingSection.style.display = 'flex';
        exportNewSection.style.display = 'none';
        validateExportForm();
    });
    
    exportTypeNew.addEventListener('change', () => {
        exportExistingSection.style.display = 'none';
        exportNewSection.style.display = 'flex';
        validateExportForm();
    });
    
    exportNewModeSelect.addEventListener('change', () => {
        const selectedModeName = getModeName(exportNewModeSelect.value);
        exportNewItName.value = `새 [${selectedModeName}] 일정`;
        validateExportForm();
    });
    
    exportNewItName.addEventListener('input', validateExportForm);
    exportNewPlaceName.addEventListener('input', validateExportForm);
    exportNewDate.addEventListener('input', validateExportForm);
    exportNewTime.addEventListener('input', validateExportForm);
    exportNewMemo.addEventListener('input', validateExportForm);

    // Memo Modal target type radio buttons
    memoTargetExisting.addEventListener('change', () => {
        memoTargetExistingContainer.style.display = 'block';
        memoTargetNewContainer.style.display = 'none';
    });
    memoTargetNew.addEventListener('change', () => {
        memoTargetExistingContainer.style.display = 'none';
        memoTargetNewContainer.style.display = 'flex';
    });
    
    itineraryNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleModalSubmit();
        } else if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Confirm modal buttons
    btnConfirmCancel.addEventListener('click', closeConfirm);
    btnConfirmYes.addEventListener('click', () => {
        if (confirmCallback) {
            confirmCallback();
        }
        closeConfirm();
    });
    
    // Route mode selector buttons binding
    document.querySelectorAll('.route-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectRouteMode(btn.dataset.mode);
        });
    });
    
    // API Settings Modal Toggles
    btnApiSettings.addEventListener('click', () => {
        googleApiKeyInput.value = localStorage.getItem('google_maps_api_key') || '';
        apiSettingsModal.style.display = 'flex';
        googleApiKeyInput.focus();
    });
    
    btnApiCancel.addEventListener('click', () => {
        apiSettingsModal.style.display = 'none';
    });
    
    btnApiSave.addEventListener('click', () => {
        const key = googleApiKeyInput.value.trim();
        localStorage.setItem('google_maps_api_key', key);
        apiSettingsModal.style.display = 'none';
        showToast("Google Maps API Key가 저장되었습니다.");
        updateRoute();
    });

    // Header logo click listener (Reset view to Gyeongbokgung)
    const headerLogo = document.getElementById('header-logo');
    if (headerLogo) {
        headerLogo.addEventListener('click', () => {
            if (map) {
                map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
                showToast('경복궁 (기본 위치)로 지도가 이동되었습니다.');
            }
        });
    }

    // Share & File Transfer Modal Events
    if (btnShareLink) {
        btnShareLink.addEventListener('click', openShareModal);
    }
    if (btnShareModalClose) {
        btnShareModalClose.addEventListener('click', closeShareModal);
    }
    if (shareHostInput) {
        shareHostInput.addEventListener('input', updateShareUrlDisplay);
    }
    if (btnCopyShareUrl) {
        btnCopyShareUrl.addEventListener('click', copyShareUrl);
    }
    if (btnExportJson) {
        btnExportJson.addEventListener('click', exportToJsonFile);
    }
    if (btnImportJsonTrigger && importJsonFileInput) {
        btnImportJsonTrigger.addEventListener('click', () => importJsonFileInput.click());
        importJsonFileInput.addEventListener('change', importFromJsonFile);
    }
}

// --- Export Modal Handlers ---
function closeExportModal() {
    exportModal.style.display = 'none';
}

window.closeExportModal = closeExportModal;

window.openExportModal = function(sourceType, sourceData) {
    exportSourceData = { type: sourceType, data: sourceData };
    selectedTargetMode = null;
    selectedTargetItineraryId = null;
    btnExportSubmit.disabled = true;
    
    // Set target display text
    if (sourceType === 'place') {
        exportSourceName.textContent = `[장소] ${sourceData.name}`;
    } else {
        exportSourceName.textContent = `[일정] ${sourceData.name}`;
    }
    
    // Reset export type radio
    exportTypeExisting.checked = true;
    exportExistingSection.style.display = 'flex';
    exportNewSection.style.display = 'none';
    
    // Populating New mode options
    exportNewModeSelect.innerHTML = '';
    const otherModes = ['travel', 'business', 'custom', 'memo'].filter(m => m !== currentMode);
    otherModes.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = getModeName(m);
        exportNewModeSelect.appendChild(opt);
    });
    
    // Pre-populate New Itinerary info
    const initialTargetMode = otherModes[0] || 'travel';
    exportNewItName.value = `새 [${getModeName(initialTargetMode)}] 일정`;
    
    // Pre-populate place details if available
    if (sourceType === 'place') {
        exportNewPlaceDetails.style.display = 'flex';
        exportNewPlaceName.value = sourceData.name || '';
        exportNewDate.value = sourceData.memoDate || '';
        exportNewTime.value = sourceData.memoTime || '';
        exportNewMemo.value = sourceData.memoText || '';
        
        if (!exportNewDate.value) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            exportNewDate.value = `${yyyy}-${mm}-${dd}`;
        }
    } else {
        // Itinerary
        if (sourceData.places && sourceData.places.length > 0) {
            exportNewPlaceDetails.style.display = 'flex';
            const firstPlace = sourceData.places[0];
            exportNewPlaceName.value = firstPlace.name || '';
            exportNewDate.value = firstPlace.memoDate || '';
            exportNewTime.value = firstPlace.memoTime || '';
            exportNewMemo.value = firstPlace.memoText || '';
            
            if (!exportNewDate.value) {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                exportNewDate.value = `${yyyy}-${mm}-${dd}`;
            }
        } else {
            exportNewPlaceDetails.style.display = 'none';
        }
    }
    
    renderExportModesList();
    validateExportForm();
    exportModal.style.display = 'flex';
};

function validateExportForm() {
    const isExisting = exportTypeExisting.checked;
    if (isExisting) {
        btnExportSubmit.disabled = !selectedTargetItineraryId;
    } else {
        const itName = exportNewItName.value.trim();
        const mode = exportNewModeSelect.value;
        let valid = itName !== '' && mode !== '';
        
        if (exportSourceData) {
            if (exportSourceData.type === 'place') {
                const pName = exportNewPlaceName.value.trim();
                valid = valid && pName !== '';
            } else if (exportSourceData.type === 'itinerary' && exportSourceData.data.places && exportSourceData.data.places.length > 0) {
                const pName = exportNewPlaceName.value.trim();
                valid = valid && pName !== '';
            }
        }
        btnExportSubmit.disabled = !valid;
    }
}

function renderExportModesList() {
    exportModesContainer.innerHTML = '';
    
    const otherModes = ['travel', 'business', 'custom', 'memo'].filter(m => m !== currentMode);
    
    otherModes.forEach(mode => {
        // Mode container
        const modeWrapper = document.createElement('div');
        modeWrapper.style.display = 'flex';
        modeWrapper.style.flexDirection = 'column';
        modeWrapper.style.gap = '4px';
        
        // Mode header
        const header = document.createElement('div');
        header.className = 'export-mode-header';
        
        let modeIcon = mode === 'travel' ? 'fa-plane' : (mode === 'business' ? 'fa-briefcase' : (mode === 'custom' ? 'fa-route' : 'fa-note-sticky'));
        header.innerHTML = `
            <span><i class="fa-solid ${modeIcon}"></i> ${getModeName(mode)} 모드</span>
            <i class="fa-solid fa-chevron-down export-chevron" style="font-size: 0.8rem; transition: transform 0.2s;"></i>
        `;
        
        // Itineraries list container
        const listContainer = document.createElement('div');
        listContainer.className = 'export-itineraries-list';
        listContainer.id = `export-list-${mode}`;
        
        header.addEventListener('click', () => {
            const isShowing = listContainer.classList.contains('show');
            // Collapse all others
            document.querySelectorAll('.export-itineraries-list').forEach(el => el.classList.remove('show'));
            document.querySelectorAll('.export-mode-header').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.export-chevron').forEach(el => el.style.transform = 'rotate(0deg)');
            
            if (!isShowing) {
                listContainer.classList.add('show');
                header.classList.add('active');
                header.querySelector('.export-chevron').style.transform = 'rotate(180deg)';
                
                // If there are no itineraries, prompt to create
                const modeItineraries = getItinerariesForMode(mode);
                if (modeItineraries.length === 0) {
                    showConfirm(
                        `<i class="fa-solid fa-circle-question" style="color: var(--primary-blue);"></i> 일정 생성`,
                        `[${getModeName(mode)}] 모드에 등록된 일정이 없습니다. 새로운 일정을 만드시겠습니까?`,
                        () => {
                            // Yes: create new itinerary
                            const newItName = `새 [${getModeName(mode)}] 일정`;
                            let targetItineraries = getItinerariesForMode(mode);
                            
                            const deviceId = PointMapStorage.getDeviceId();
                            const userId = PointMapStorage.getUserId();
                            const now = new Date().toISOString();
                            
                            const newIt = {
                                id: 'itinerary-' + Date.now(),
                                name: newItName,
                                mode: mode,
                                localUserId: deviceId,
                                userId: userId,
                                createdAt: now,
                                updatedAt: now,
                                places: []
                            };
                            targetItineraries.push(newIt);
                            PointMapStorage.saveItineraries(mode, targetItineraries);
                            PointMapStorage.setCurrentItineraryId(mode, newIt.id);
                            
                            showToast(`새로운 일정이 생성되었습니다.`);
                            
                            // Re-render
                            renderExportModesList();
                            
                            // Automatically expand the newly updated mode
                            setTimeout(() => {
                                const headers = document.querySelectorAll('.export-mode-header');
                                headers.forEach(h => {
                                    if (h.textContent.includes(getModeName(mode))) {
                                        h.click();
                                    }
                                });
                            }, 100);
                        }
                    );
                }
            }
        });
        
        // Populate itineraries
        const modeItineraries = getItinerariesForMode(mode);
        if (modeItineraries.length === 0) {
            const noIt = document.createElement('div');
            noIt.className = 'export-no-itinerary';
            noIt.innerHTML = `
                <span>등록된 일정이 없습니다.</span>
                <button class="btn-create-itinerary-inline">새 일정 만들기</button>
            `;
            noIt.querySelector('.btn-create-itinerary-inline').addEventListener('click', (e) => {
                e.stopPropagation();
                showConfirm(
                    `<i class="fa-solid fa-circle-question" style="color: var(--primary-blue);"></i> 일정 생성`,
                    `[${getModeName(mode)}] 모드에 새로운 일정을 만드시겠습니까?`,
                    () => {
                        const newItName = `새 [${getModeName(mode)}] 일정`;
                        let targetItineraries = getItinerariesForMode(mode);
                        
                        const deviceId = PointMapStorage.getDeviceId();
                        const userId = PointMapStorage.getUserId();
                        const now = new Date().toISOString();
                        
                        const newIt = {
                            id: 'itinerary-' + Date.now(),
                            name: newItName,
                            mode: mode,
                            localUserId: deviceId,
                            userId: userId,
                            createdAt: now,
                            updatedAt: now,
                            places: []
                        };
                        targetItineraries.push(newIt);
                        PointMapStorage.saveItineraries(mode, targetItineraries);
                        PointMapStorage.setCurrentItineraryId(mode, newIt.id);
                        
                        showToast(`새로운 일정이 생성되었습니다.`);
                        renderExportModesList();
                        
                        setTimeout(() => {
                            const headers = document.querySelectorAll('.export-mode-header');
                            headers.forEach(h => {
                                if (h.textContent.includes(getModeName(mode))) {
                                    h.click();
                                }
                            });
                        }, 100);
                    }
                );
            });
            listContainer.appendChild(noIt);
        } else {
            modeItineraries.forEach(it => {
                const item = document.createElement('div');
                item.className = 'export-itinerary-item';
                if (selectedTargetItineraryId === it.id) {
                    item.classList.add('selected');
                }
                
                // Get places desc
                const desc = getItineraryDescription(it);
                
                item.innerHTML = `
                    <span class="export-itinerary-title">${it.name}</span>
                    <span class="export-itinerary-meta"><i class="fa-solid fa-location-dot"></i> ${desc}</span>
                `;
                
                item.addEventListener('click', () => {
                    document.querySelectorAll('.export-itinerary-item').forEach(el => el.classList.remove('selected'));
                    item.classList.add('selected');
                    selectedTargetMode = mode;
                    selectedTargetItineraryId = it.id;
                    validateExportForm();
                });
                
                listContainer.appendChild(item);
            });
        }
        
        modeWrapper.appendChild(header);
        modeWrapper.appendChild(listContainer);
        exportModesContainer.appendChild(modeWrapper);
    });
}

function getItineraryDescription(it) {
    if (!it.places || it.places.length === 0) {
        return '등록된 장소 없음';
    }
    const names = it.places.map(p => p.name).join(', ');
    const dates = it.places
        .filter(p => p.memoDate)
        .map(p => formatDateWithDay(p.memoDate) + (p.memoTime ? ' ' + p.memoTime : ''));
    
    let dateStr = '';
    if (dates.length > 0) {
        const uniqueDates = [...new Set(dates)];
        dateStr = uniqueDates.slice(0, 2).join(', ') + (uniqueDates.length > 2 ? ' 외' : '');
    }
    
    if (dateStr) {
        return `${dateStr} | ${names}`;
    }
    return names;
}

function executeExport() {
    if (!exportSourceData) return;
    
    const isExisting = exportTypeExisting.checked;
    const deviceId = PointMapStorage.getDeviceId();
    const userId = PointMapStorage.getUserId();
    const now = new Date().toISOString();
    
    if (isExisting) {
        if (!selectedTargetMode || !selectedTargetItineraryId) return;
        
        let targetItineraries = getItinerariesForMode(selectedTargetMode);
        let targetIt = targetItineraries.find(it => it.id === selectedTargetItineraryId);
        if (!targetIt) return;
        
        if (exportSourceData.type === 'place') {
            const place = exportSourceData.data;
            const copiedPlace = {
                id: 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                name: place.name,
                lat: place.lat,
                lng: place.lng,
                memoDate: place.memoDate || '',
                memoTime: place.memoTime || '',
                memoText: place.memoText || '',
                transport: place.transport || 'driving',
                localUserId: deviceId,
                userId: userId,
                createdAt: now,
                updatedAt: now
            };
            targetIt.places.push(copiedPlace);
        } else {
            const currentIt = exportSourceData.data;
            currentIt.places.forEach(p => {
                const copiedPlace = {
                    id: 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                    name: p.name,
                    lat: p.lat,
                    lng: p.lng,
                    memoDate: p.memoDate || '',
                    memoTime: p.memoTime || '',
                    memoText: p.memoText || '',
                    transport: p.transport || 'driving',
                    localUserId: deviceId,
                    userId: userId,
                    createdAt: now,
                    updatedAt: now
                };
                targetIt.places.push(copiedPlace);
            });
        }
        
        PointMapStorage.saveItineraries(selectedTargetMode, targetItineraries);
        closeExportModal();
        showToast('선택한 일정으로 내보내기가 완료되었습니다.');
        renderAll();
        
    } else {
        // Create new itinerary
        const mode = exportNewModeSelect.value;
        const itName = exportNewItName.value.trim() || '새 일정';
        
        const newIt = {
            id: 'itinerary-' + Date.now(),
            name: itName,
            mode: mode,
            localUserId: deviceId,
            userId: userId,
            createdAt: now,
            updatedAt: now,
            places: []
        };
        
        if (exportSourceData.type === 'place') {
            const place = exportSourceData.data;
            const copiedPlace = {
                id: 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                name: exportNewPlaceName.value.trim() || place.name,
                lat: place.lat,
                lng: place.lng,
                memoDate: exportNewDate.value,
                memoTime: exportNewTime.value,
                memoText: exportNewMemo.value.trim(),
                transport: place.transport || 'driving',
                localUserId: deviceId,
                userId: userId,
                createdAt: now,
                updatedAt: now
            };
            newIt.places.push(copiedPlace);
        } else {
            const currentIt = exportSourceData.data;
            currentIt.places.forEach((p, idx) => {
                if (idx === 0) {
                    const copiedPlace = {
                        id: 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                        name: exportNewPlaceName.value.trim() || p.name,
                        lat: p.lat,
                        lng: p.lng,
                        memoDate: exportNewDate.value,
                        memoTime: exportNewTime.value,
                        memoText: exportNewMemo.value.trim(),
                        transport: p.transport || 'driving',
                        localUserId: deviceId,
                        userId: userId,
                        createdAt: now,
                        updatedAt: now
                    };
                    newIt.places.push(copiedPlace);
                } else {
                    const copiedPlace = {
                        id: 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                        name: p.name,
                        lat: p.lat,
                        lng: p.lng,
                        memoDate: p.memoDate || '',
                        memoTime: p.memoTime || '',
                        memoText: p.memoText || '',
                        transport: p.transport || 'driving',
                        localUserId: deviceId,
                        userId: userId,
                        createdAt: now,
                        updatedAt: now
                    };
                    newIt.places.push(copiedPlace);
                }
            });
        }
        
        let targetItineraries = getItinerariesForMode(mode);
        targetItineraries.push(newIt);
        PointMapStorage.saveItineraries(mode, targetItineraries);
        PointMapStorage.setCurrentItineraryId(mode, newIt.id);
        
        closeExportModal();
        showToast('선택한 일정으로 내보내기가 완료되었습니다.');
        renderAll();
    }
}

// --- Web Share & File Transfer Handlers ---
async function openShareModal() {
    const currentIt = getCurrentItinerary();
    if (!currentIt) {
        showToast('공유할 일정이 선택되지 않았습니다.');
        return;
    }
    
    let savedHost = localStorage.getItem('point_map_custom_share_host');
    if (!savedHost) {
        savedHost = window.location.origin + window.location.pathname;
    }
    if (shareHostInput) {
        shareHostInput.value = savedHost;
    }
    
    await updateShareUrlDisplay();
    shareModal.style.display = 'flex';
}

async function updateShareUrlDisplay() {
    const currentIt = getCurrentItinerary();
    if (!currentIt) return;

    let baseHost = shareHostInput ? shareHostInput.value.trim() : '';
    if (!baseHost) {
        baseHost = window.location.origin + window.location.pathname;
    }
    
    if (shareLocalWarning) {
        if (baseHost.includes('127.0.0.1') || baseHost.includes('localhost')) {
            shareLocalWarning.style.display = 'block';
        } else {
            shareLocalWarning.style.display = 'none';
        }
    }
    
    localStorage.setItem('point_map_custom_share_host', baseHost);
    
    shareUrlInput.value = '공유 링크를 생성하는 중...';
    let shareParam = '';
    
    if (baseHost.startsWith(window.location.origin)) {
        try {
            const res = await fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify(currentIt)
            });
            const contentType = res.headers.get('content-type') || '';
            if (res.ok && contentType.includes('application/json')) {
                const data = await res.json();
                if (data.success && data.shareId) {
                    shareParam = `?shareId=${data.shareId}`;
                }
            }
        } catch (e) {
            console.warn('Server API failed, using URL parameter encoding:', e);
        }
    }
    
    if (!shareParam) {
        try {
            const jsonStr = JSON.stringify(currentIt);
            const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
            shareParam = `?shareData=${encoded}`;
        } catch (err) {
            console.error('Failed to encode share link:', err);
        }
    }
    
    const cleanHost = baseHost.split('?')[0].split('#')[0];
    shareUrlInput.value = cleanHost + shareParam;
}

function closeShareModal() {
    shareModal.style.display = 'none';
}

function copyShareUrl() {
    if (!shareUrlInput.value || shareUrlInput.value.includes('생성하는 중')) return;
    shareUrlInput.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrlInput.value).then(() => {
            showToast('공유 링크가 클립보드에 복사되었습니다! 상대방에게 전달하세요.');
        }).catch(() => {
            document.execCommand('copy');
            showToast('공유 링크가 클립보드에 복사되었습니다!');
        });
    } else {
        document.execCommand('copy');
        showToast('공유 링크가 클립보드에 복사되었습니다!');
    }
}

function exportToJsonFile() {
    try {
        const allData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            userItinerariesData: userItinerariesData
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `point_map_data_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('JSON 데이터 백업 파일이 다운로드되었습니다.');
    } catch (e) {
        console.error('Export failed:', e);
        showToast('데이터 내보내기에 실패했습니다.');
    }
}

function importFromJsonFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const importedObj = JSON.parse(event.target.result);
            let importedData = null;
            if (importedObj.userItinerariesData) {
                importedData = importedObj.userItinerariesData;
            } else if (importedObj.travel || importedObj.business || importedObj.custom || importedObj.memo) {
                importedData = importedObj;
            } else if (importedObj.id && importedObj.places) {
                // Single itinerary
                const mode = importedObj.mode || 'travel';
                userItinerariesData[mode] = userItinerariesData[mode] || [];
                userItinerariesData[mode].push(importedObj);
                importedData = userItinerariesData;
            }
            
            if (importedData) {
                ['travel', 'business', 'custom', 'memo'].forEach(mode => {
                    if (Array.isArray(importedData[mode])) {
                        userItinerariesData[mode] = importedData[mode];
                        PointMapStorage.saveItineraries(mode, userItinerariesData[mode]);
                    }
                });
                
                // Sync with server if logged in
                const userId = PointMapStorage.getUserId();
                const password = PointMapStorage.getUserPassword();
                if (userId && password) {
                    await saveDataToServer(userId, password, userItinerariesData);
                }
                
                loadData();
                renderAll();
                closeShareModal();
                showToast('JSON 데이터 불러오기 및 성공적 병합이 완료되었습니다!');
            } else {
                showToast('올바르지 않은 JSON 파일 형식입니다.');
            }
        } catch (err) {
            console.error('JSON parsing failed:', err);
            showToast('JSON 파일을 읽는 중 오류가 발생했습니다.');
        }
        e.target.value = '';
    };
    reader.readAsText(file);
}

async function checkAndLoadSharedData() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('shareId') || urlParams.get('id');
    const shareData = urlParams.get('shareData');
    
    let sharedItinerary = null;
    
    if (shareId) {
        try {
            const res = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`);
            const contentType = res.headers.get('content-type') || '';
            if (res.ok && contentType.includes('application/json')) {
                sharedItinerary = await res.json();
            }
        } catch (e) {
            console.warn('Failed to load shared payload from server:', e);
        }
    } else if (shareData) {
        try {
            const jsonStr = decodeURIComponent(escape(atob(shareData)));
            sharedItinerary = JSON.parse(jsonStr);
        } catch (e) {
            console.warn('Failed to parse shareData parameter:', e);
        }
    }
    
    if (sharedItinerary && sharedItinerary.name && Array.isArray(sharedItinerary.places)) {
        showConfirm(
            `<i class="fa-solid fa-cloud-arrow-down" style="color: var(--primary-blue);"></i> 공유받은 일정 확인`,
            `공유받은 일정 <strong>'[${sharedItinerary.name}]'</strong> (장소 ${sharedItinerary.places.length}개)을(를) 확인했습니다.<br>이 일정을 내 목록에 추가하시겠습니까?`,
            async () => {
                const targetMode = sharedItinerary.mode || 'travel';
                const newIt = {
                    ...sharedItinerary,
                    id: 'itinerary-' + Date.now(),
                    name: `[공유] ${sharedItinerary.name}`,
                    mode: targetMode,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                let targetItineraries = getItinerariesForMode(targetMode);
                targetItineraries.push(newIt);
                PointMapStorage.saveItineraries(targetMode, targetItineraries);
                PointMapStorage.setCurrentItineraryId(targetMode, newIt.id);
                
                const userId = PointMapStorage.getUserId();
                const password = PointMapStorage.getUserPassword();
                if (userId && password) {
                    await saveDataToServer(userId, password, userItinerariesData);
                }
                
                switchMode(targetMode);
                selectItinerary(newIt.id);
                showToast(`'${newIt.name}' 일정이 성공적으로 내 목록에 추가되었습니다!`);
                
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        );
    }
}

// --- App Entry point ---
window.addEventListener('DOMContentLoaded', async () => {
    initMap();
    setupEventListeners();
    
    // Schedule alarm notifications
    requestNotificationPermission();
    checkNotifications();
    setInterval(checkNotifications, 60000);
    
    const savedUserId = PointMapStorage.getUserId();
    const savedPassword = PointMapStorage.getUserPassword();
    if (savedUserId && savedPassword) {
        document.getElementById('login-username-input').value = savedUserId;
        document.getElementById('login-password-input').value = savedPassword;
    }
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('user-profile-badge').style.display = 'none';
    loadData();
    renderAll();
    const defaultIt = getCurrentItinerary();
    if (defaultIt && defaultIt.places.length > 0) {
        fitMapToPlaces(defaultIt.places);
    } else {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
    await checkAndLoadSharedData();
});
