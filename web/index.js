window.addEventListener('load', async () => {
  setEvents()
  await callLoadArduinoInfoInLoop()
})

async function callLoadArduinoInfoInLoop () {
  console.log('chamou')
  await loadArduinoInfo()
  setTimeout(callLoadArduinoInfoInLoop, 5000)
}

async function loadArduinoInfo () {
  await fetch('http://192.168.15.40/')
    .then(response => {
      response.json().then(async data => {
        loadValues(data)
        await handleWithComponents(data)
      })
    })
    .catch(error => {
      console.error(error)
    })
}

function setEvents () {
  document.getElementById('soilMoisture').addEventListener('change', async (event) => {
    document.getElementById('soilMoistureDescription').textContent = `Ligar Bomba de Água quando valor estiver acima de: ${event.target.value}%`
    await loadArduinoInfo()
  })
  
  document.getElementById('luminosity').addEventListener('change', async (event) => {
    document.getElementById('luminosityDescription').textContent = `Ligar Lâmpada quando valor estiver abaixo de: ${event.target.value}%`
    await loadArduinoInfo()
  })
  
  document.getElementById('temperature').addEventListener('change', async (event) => {
    document.getElementById('temperatureDescription').textContent = `Ligar Cooler quando temperatura estiver acima de: ${event.target.value}°C`
    await loadArduinoInfo()
  })

  document.getElementById('heatingLamp').addEventListener('change', async (event) => {
    document.getElementById('heatingLampDescription').textContent = `Ligar Lâmpada Aquecedora quando temperatura estiver abaixo de: ${event.target.value}°C`
    await loadArduinoInfo()
  })

  document.getElementById('soilMoistureEnabled').addEventListener('change', async (event) => {
    if (event.target.checked) {
      document.getElementById('soilMoisture').removeAttribute('disabled')
      await loadArduinoInfo()
    } else {
      document.getElementById('soilMoisture').setAttribute('disabled', true)
    }
  })

  document.getElementById('luminosityEnabled').addEventListener('change', async (event) => {
    if (event.target.checked) {
      document.getElementById('luminosity').removeAttribute('disabled')
      await loadArduinoInfo()
    } else {
      document.getElementById('luminosity').setAttribute('disabled', true)
    }
  })

  document.getElementById('temperatureEnabled').addEventListener('change', async (event) => {
    if (event.target.checked) {
      document.getElementById('temperature').removeAttribute('disabled')
      await loadArduinoInfo()
    } else {
      document.getElementById('temperature').setAttribute('disabled', true)
    }
  })

  document.getElementById('heatingLampEnabled').addEventListener('change', async (event) => {
    if (event.target.checked) {
      document.getElementById('heatingLamp').removeAttribute('disabled')
      await loadArduinoInfo()
    } else {
      document.getElementById('heatingLamp').setAttribute('disabled', true)
    }
  })
}

function loadValues ({ air_humidity, luminosity, temperature, soil_moisture, status_water_pump, status_lamp, status_cooler, status_heating_lamp }) {
  const statusWaterPumpDetails = handleWithStatusServer(status_water_pump)
  document.getElementById('soilMoistureValueDescription').textContent = `${getPercentage(soil_moisture)}%`
  document.getElementById('waterBombStatus').textContent = statusWaterPumpDetails.femDescription
  document.getElementById('waterBombStatus').style.color = statusWaterPumpDetails.color

  const statusLampDetails = handleWithStatusServer(status_lamp)
  document.getElementById('luminosityValueDescription').textContent = `${getPercentage(luminosity)}%`
  document.getElementById('lampStatus').textContent = statusLampDetails.femDescription
  document.getElementById('lampStatus').style.color = statusLampDetails.color

  const statusCoolerDetails = handleWithStatusServer(status_cooler)
  document.getElementById('temperatureValueDescription').textContent = temperature + '°C'
  document.getElementById('airHumidityValueDescription').textContent = `${getPercentage(air_humidity)}%`
  document.getElementById('coolerStatus').textContent = statusCoolerDetails.maleDescription
  document.getElementById('coolerStatus').style.color = statusCoolerDetails.color

  const statusHeatingLampDetails = handleWithStatusServer(status_heating_lamp)
  document.getElementById('heatingLampStatus').textContent = statusHeatingLampDetails.femDescription
  document.getElementById('heatingLampStatus').style.color = statusHeatingLampDetails.color
}

function handleWithStatusServer (status) {
  if (Number(status) === 1) {
    return {
      maleDescription: 'Ligado',
      femDescription: 'Ligada',
      color: 'green'
    }
  } else {
    return {
      maleDescription: 'Desligado',
      femDescription: 'Desligada',
      color: 'red'
    }
  }
}

function getPercentage (value) {
  return ((Number(value) * 100) / 1024).toFixed(2)
}

async function handleWithComponents ({ luminosity, temperature, soil_moisture, status_water_pump, status_lamp, status_cooler, status_heating_lamp }) {
  let statusWaterPump = status_water_pump
  let lampStatus = status_lamp
  let coolerStatus = status_cooler
  let heatingLampStatus = status_heating_lamp

  const isSoilMoistureEnabled = document.getElementById('soilMoistureEnabled').checked
  const isLuminosityEnabled = document.getElementById('luminosityEnabled').checked
  const isTemperatureEnabled = document.getElementById('temperatureEnabled').checked
  const isheatingLampEnabled = document.getElementById('heatingLampEnabled').checked

  if (isSoilMoistureEnabled) {
    statusWaterPump = Number(getPercentage(soil_moisture) > Number(document.getElementById('soilMoisture').value))
  }

  if (isLuminosityEnabled) {
    lampStatus = Number(getPercentage(luminosity) < Number(document.getElementById('luminosity').value))
  }

  if (isTemperatureEnabled) { 
    coolerStatus = Number(parseFloat(temperature) > Number(document.getElementById('temperature').value))
  }

  if (isheatingLampEnabled) {
    heatingLampStatus = Number(parseFloat(temperature) < Number(document.getElementById('heatingLamp').value))
  }

  const response = await fetch(`http://192.168.15.40?waterPump=${statusWaterPump}&lamp=${lampStatus}&cooler=${coolerStatus}&heatingLamp=${heatingLampStatus}`)
    .then(response => response.json())
    .catch(error => console.error(error))
  
  loadValues(response)
}
