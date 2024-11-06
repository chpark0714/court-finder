import { useState, useEffect, useCallback } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { courts } from './data/courts'
import { getWeatherData } from './services/weatherService'
import { calculateCourtScore } from './utils/recommendationEngine'
import CourtsMap from './components/CourtsMap'
import './App.css'
import { getScoreClass } from './utils/scoreUtils'

function App() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedSport, setSelectedSport] = useState('all');
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const minute = i % 2 === 0 ? '00' : '30'
    const ampm = hour < 12 ? 'AM' : 'PM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return {
      value: `${hour.toString().padStart(2, '0')}:${minute}`,
      label: `${displayHour}:${minute} ${ampm}`
    }
  })

  const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  useEffect(() => {
    const fetchWeatherData = async () => {
      setIsLoading(true);
      try {
        if (!selectedDate || !selectedTime || !WEATHER_API_KEY) {
          console.error('Missing required data');
          return;
        }

        const weatherPromises = courts.map(async (court) => {
          try {
            const response = await fetch(
              `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${court.latitude},${court.longitude}&days=7&aqi=no`
            );
            
            if (!response.ok) {
              throw new Error(`Weather API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Weather API Response for', court.name, ':', data);

            const selectedForecast = data.forecast.forecastday.find(day => 
              day.date === selectedDate
            );

            if (!selectedForecast?.hour) {
              console.error('No hourly forecast found for date:', selectedDate);
              return court;
            }

            const [selectedHour] = selectedTime.split(':');
            const targetHour = parseInt(selectedHour);
            
            const closestHourForecast = selectedForecast.hour.reduce((closest, current) => {
              const currentHour = new Date(current.time).getHours();
              const currentDiff = Math.abs(currentHour - targetHour);
              const closestDiff = Math.abs(new Date(closest.time).getHours() - targetHour);
              return currentDiff < closestDiff ? current : closest;
            });

            return {
              ...court,
              weather: {
                dt: new Date(closestHourForecast.time).getTime() / 1000,
                temp: closestHourForecast.temp_f,
                feels_like: closestHourForecast.feelslike_f,
                humidity: closestHourForecast.humidity,
                windSpeed: closestHourForecast.wind_mph,
                windGust: closestHourForecast.gust_mph,
                description: closestHourForecast.condition.text,
                icon: closestHourForecast.condition.icon,
                forecastTime: new Date(closestHourForecast.time).toLocaleString()
              }
            };
          } catch (error) {
            console.error(`Error fetching weather for court ${court.name}:`, error);
            return court;
          }
        });

        const courtsWithWeather = await Promise.all(weatherPromises);
        console.log('Courts with weather:', courtsWithWeather);
        setRecommendations(courtsWithWeather);
      } catch (error) {
        console.error('Error details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherData();
  }, [selectedDate, selectedTime, courts, WEATHER_API_KEY]);

  // 필터링된 코트 목록을 계산하는 함수
  const getFilteredCourts = useCallback(() => {
    if (!recommendations) return [];
    
    return recommendations.filter(court => {
      // 지역 필터
      if (selectedLocation !== 'all' && court.city !== selectedLocation) {
        return false;
      }
      
      // 스포츠 종류 필터
      if (selectedSport !== 'all') {
        if (!court.type.includes(selectedSport.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });
  }, [recommendations, selectedLocation, selectedSport]);

  // 필터링된 코트 목록을 저장할 state
  const [filteredCourts, setFilteredCourts] = useState([]);

  // 필터가 변경될 때마다 필터링된 목록 업데이트
  useEffect(() => {
    setFilteredCourts(getFilteredCourts());
  }, [getFilteredCourts, recommendations, selectedLocation, selectedSport]);

  return (
    <div className="app-container">
      <h1 className="app-title">Las Vegas Courts</h1>
      
      <div className="search-filters">
        <div className="filters-row">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="location-select"
          >
            <option value="all">All Locations</option>
            <option value="lasvegas">Las Vegas</option>
            <option value="henderson">Henderson</option>
          </select>

          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="sport-select"
          >
            <option value="all">All Sports</option>
            <option value="tennis">Tennis</option>
            <option value="pickleball">Pickleball</option>
          </select>

          <div className="date-time-picker">
            <input 
              type="date" 
              value={selectedDate}
              min={today}
              max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-picker"
            />
            <select 
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="time-picker"
            >
              {timeOptions.map(time => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="map-container">
        {!isLoading && <CourtsMap courts={filteredCourts} />} {/* 필터링된 목록 사용 */}
      </div>

      <div className="recommendations-grid">
        {isLoading ? (
          <div className="loading">Loading weather data...</div>
        ) : filteredCourts.length > 0 ? (
          filteredCourts.map((court) => (  // 필터링된 목록 사용
            <div key={court.id} className="court-card">
              <div className="court-header">
                <h3>{court.name}</h3>
                {court.publicCourt ? (
                  <span className="public-badge">Public</span>
                ) : (
                  <span className="private-badge">Private</span>
                )}
              </div>

              {court.weather && (
                <div className="weather-section">
                  <div className="weather-main">
                    <img 
                      src={court.weather.icon}
                      alt={court.weather.description}
                      className="weather-icon"
                    />
                    <div className="temperature">
                      <span className="temp-main">{Math.round(court.weather.temp)}°F</span>
                      <span className="feels-like">Feels like: {Math.round(court.weather.feels_like)}°F</span>
                    </div>
                  </div>
                  <div className="weather-details">
                    <div className="weather-item">
                      <span className="weather-label">Wind</span>
                      <span className="weather-value">{Math.round(court.weather.windSpeed)} mph</span>
                    </div>
                    <div className="weather-item">
                      <span className="weather-label">Humidity</span>
                      <span className="weather-value">{court.weather.humidity}%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="court-details">
                <p className="address">{court.address}</p>
                <div className="court-type">
                  {court.type.map((type, index) => (
                    <span key={index} className="type-badge">{type}</span>
                  ))}
                </div>
                {court.courtCount && (
                  <p className="court-count">
                    <span className="count-icon">🎾</span> {court.courtCount} courts
                  </p>
                )}
                {court.lighting && (
                  <p className="lighting-available">
                    <span className="lighting-icon">✨</span> Lighting available
                  </p>
                )}
              </div>

              {court.bookingUrl && (
                <a 
                  href={court.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="book-button"
                >
                  Book Court
                </a>
              )}
            </div>
          ))
        ) : (
          <div className="no-results">
            No courts found matching your filters
          </div>
        )}
      </div>
    </div>
  );
}

export default App
