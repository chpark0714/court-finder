const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY
const BASE_URL = 'http://api.weatherapi.com/v1'

export const getWeatherData = async (latitude, longitude, date = 'today') => {
  try {
    // 현재 날씨를 가져올 때
    if (date === 'today') {
      const response = await fetch(
        `${BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&aqi=no`
      )
      const data = await response.json()
      return {
        temp: data.current.temp_f,
        windSpeed: data.current.wind_mph,
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        feelsLike: data.current.feelslike_f,
        isDay: data.current.is_day
      }
    } 
    // 예보 데이터를 가져올 때
    else {
      const response = await fetch(
        `${BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&days=7&aqi=no`
      )
      const data = await response.json()
      
      // 선택한 날짜의 예보 찾기
      const forecast = data.forecast.forecastday.find(
        day => day.date === date
      )

      if (!forecast) return null

      return {
        temp: forecast.day.avgtemp_f,
        windSpeed: forecast.day.maxwind_mph,
        condition: forecast.day.condition.text,
        humidity: forecast.day.avghumidity,
        feelsLike: forecast.day.avgtemp_f,
        isDay: 1,
        date: forecast.date
      }
    }
  } catch (error) {
    console.error('Weather data fetch failed:', error)
    return null
  }
} 