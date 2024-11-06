export const calculateCourtScore = (weather, court) => {
  let score = 100

  // 풍속 점수 계산 (mph 기준)
  if (weather.windSpeed > court.recommendationRules.maxWindSpeed) {
    score -= Math.min(40, (weather.windSpeed - court.recommendationRules.maxWindSpeed) * 4)
  }

  // 온도 점수 계산 (화씨 기준)
  if (weather.temp < court.recommendationRules.minTemp) {
    score -= Math.min(50, (court.recommendationRules.minTemp - weather.temp) * 3)
  } else if (weather.temp > court.recommendationRules.maxTemp) {
    score -= Math.min(50, (weather.temp - court.recommendationRules.maxTemp) * 3)
  }

  // 습도 점수 계산
  if (weather.humidity > court.recommendationRules.maxHumidity) {
    score -= Math.min(30, (weather.humidity - court.recommendationRules.maxHumidity) * 2)
  }

  // 날씨 상태에 따른 추가 감점
  const badConditions = [
    'Rain', 'Light rain', 'Heavy rain', 
    'Thunderstorm', 'Snow', 'Sleet', 
    'Showers', 'Heavy showers'
  ]
  
  if (badConditions.some(condition => 
    weather.condition.toLowerCase().includes(condition.toLowerCase())
  )) {
    score -= 40
  }

  // 실내 코트의 경우 날씨 영향 감소
  if (court.indoor) {
    const weatherImpact = 100 - score
    score += weatherImpact * 0.7
  }

  // 최종 점수 계산 (0-100 범위)
  return Math.max(0, Math.min(100, Math.round(score)))
} 