import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMemo } from 'react';

// 테니스와 피클볼 마커를 다른 색상으로 정의
const tennisIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const pickleballIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 날짜와 시간을 포맷팅하는 함수
const formatDateTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

function CourtsMap({ courts }) {
  // 모든 코트의 위도와 경도를 기반으로 중심점 계산
  const center = useMemo(() => {
    if (!courts.length) return { lat: 36.15, lng: -115.139 }; // Las Vegas 기본 중심점
    
    const lats = courts.map(court => court.latitude);
    const lngs = courts.map(court => court.longitude);
    
    return {
      lat: (Math.max(...lats) + Math.min(...lats)) / 2,
      lng: (Math.max(...lngs) + Math.min(...lngs)) / 2
    };
  }, [courts]);

  // 지도 경계 설정을 위한 bounds 계산
  const bounds = useMemo(() => {
    if (!courts.length) return null;
    
    const lats = courts.map(court => court.latitude);
    const lngs = courts.map(court => court.longitude);
    
    return {
      ne: { lat: Math.max(...lats), lng: Math.max(...lngs) },
      sw: { lat: Math.min(...lats), lng: Math.min(...lngs) }
    };
  }, [courts]);

  return (
    <MapContainer 
      center={center}
      zoom={10}  // 줌 레벨 조정
      style={{ height: "300px", width: "180%" }}
      onLoad={map => {
        if (bounds) {
          map.fitBounds({
            north: bounds.ne.lat,
            south: bounds.sw.lat,
            east: bounds.ne.lng,
            west: bounds.sw.lng
          }, { padding: 100  });  // 여백 추가
        }
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {courts.map((court) => (
        <Marker
          key={court.id}
          position={[court.latitude, court.longitude]}
          icon={court.type.includes('pickleball') ? pickleballIcon : tennisIcon}
        >
          <Popup>
            <div className="popup-content">
              <h3>{court.name}</h3>
              {court.weather && (
                <div className="weather-info">
                  <div className="weather-time">
                    <span className="weather-icon">🕒</span>
                    {new Date(court.weather.dt * 1000).toLocaleString()}
                  </div>
                  <div className="weather-details">
                    <div className="weather-main">
                      <img 
                        src={court.weather.icon}  // WeatherAPI는 전체 URL을 제공합니다
                        alt={court.weather.description}
                        className="weather-icon-img"
                      />
                      <span className="weather-description">
                        {court.weather.description}
                      </span>
                    </div>
                    <div className="weather-data">
                      <p>
                        <span className="weather-label">Temperature:</span>
                        <span className="weather-value">{Math.round(court.weather.temp)}°F</span>
                        <span className="weather-subtext">
                          (Feels like: {Math.round(court.weather.feels_like)}°F)
                        </span>
                      </p>
                      <p>
                        <span className="weather-label">Wind:</span>
                        <span className="weather-value">{Math.round(court.weather.windSpeed)} mph</span>
                        {court.weather.windGust && (
                          <span className="weather-subtext">
                            (Gusts: {Math.round(court.weather.windGust)} mph)
                          </span>
                        )}
                      </p>
                      <p>
                        <span className="weather-label">Humidity:</span>
                        <span className="weather-value">{court.weather.humidity}%</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="court-info">
                <p className="court-address">{court.address}</p>
                <p className="court-type">
                  <span className="label">Type:</span> {court.type.join(', ')}
                </p>
                <p className="court-access">
                  {court.publicCourt ? 'Public Court' : 'Private Court'}
                </p>
                {court.courtCount && (
                  <p className="court-count">
                    <span className="label">Courts:</span> {court.courtCount}
                  </p>
                )}
                {court.lighting && (
                  <p className="court-lighting">✨ Lighting Available</p>
                )}
              </div>
              {court.bookingUrl && (
                <div className="court-booking">
                  <a 
                    href={court.bookingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="booking-link"
                  >
                    Book Court
                  </a>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default CourtsMap; 