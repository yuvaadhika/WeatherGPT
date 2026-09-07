// WeatherGPT WMO WIS2.0 & MQTT Topic Broker Endpoint (Node.js)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  return res.status(200).json({
    protocol: 'WMO WIS2.0 / MQTT v5.0',
    globalCentre: 'IN-IMD',
    stationCount: 38,
    activeFeeds: [
      { topic: 'origin/a/wis2/in-imd/data/core/weather/surface/synop/chennai', status: 'ACTIVE_BROKER' },
      { topic: 'in/imd/aws/+/telemetry', status: 'MQTT_BROKER_ONLINE' }
    ],
    timestamp: new Date().toISOString()
  });
}
