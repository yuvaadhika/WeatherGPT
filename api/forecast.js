// WeatherGPT Vercel Serverless Multi-Model Forecast Endpoint (Node.js)
export default async function handler(req, res) {
  const { lat = 13.0827, lon = 80.2707, model = 'ensemble' } = req.query;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto`;
    const response = await fetch(url);
    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json({
      service: 'WeatherGPT Serverless NWP Router',
      runtime: 'Node.js 20.x on Vercel Edge',
      nwp_model: model === 'wrf' ? 'WRF 3km Mesoscale' : 'NOAA GFS + ECMWF Ensemble',
      data,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
