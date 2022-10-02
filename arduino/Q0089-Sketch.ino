#include <SPI.h>
#include <Ethernet.h>
#include <dht11.h>
#define DHT11PIN A2

byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress ip(192, 168, 15, 40); // Endereço IP em que o acesso estará disponível
EthernetServer server(80);     // Criar um servidor e disponibiliza-o na porta 80

dht11 DHT11; // define o sensor DHT11 
int brightnessPin = A0; // define a porta onde contém o sensor de luminosidade
int soilMoisturePin = A1; // define a porta onde contém o sensor de humidade do solo
int heatingLampPin = 6;
int coolerPin = 7;
int waterPumpPin = 8;
int lampPin = 9;

void setup() {
    Ethernet.begin(mac, ip);  // Inicia e configurar o Ethernet Shield
    server.begin();           // Inicia o servidor, e deixa-o pronto para receber requisições
    Serial.begin(9600);
    pinMode(coolerPin, OUTPUT);
    pinMode(waterPumpPin, OUTPUT);
    pinMode(lampPin, OUTPUT);
    pinMode(heatingLampPin, OUTPUT);
}

void loop() {
    EthernetClient client = server.available();  // Busca por uma conexão com o client
    int dht11Reader = DHT11.read(DHT11PIN); // Inicia a leitura da temperatura e humidade do solo
    if (client) {  // Verifica se existe uma conexão dispoível com o cliente
        handleWithClient(client); // Lida com a conexão com o client
        delay(1);      // Espera para que o cliente consiga receber a requisição
        client.stop(); // Finaliza a conexão
    } // fim do if (client)
} // fim do loop

void handleWithClient(EthernetClient client) {
  boolean isCurrentLineBlank = true;
  String request = "";
  
  while (client.connected()) {
    if (client.available()) {   // os dados do cliente estão disponiveis para serem lidos
      char c = client.read(); // lê 1 byte (character) do cliente
      request += c;
      // Verifica se é a última linha enviada pelo client
      if (c == '\n' && isCurrentLineBlank) {
        // Configura e envia uma resposta ao cliente.
        client.println(getHttpHeader());
        client.println();
        ControlLeds(request);
        client.println(getJSONValues());
        request = "";
        break;
      }
      // toda linha de texto recebida do cliente termina com os caracteres \r\n
      if (c == '\n') {
        isCurrentLineBlank = true;
      }
      else if (c != '\r') {
          // um caractere de texto foi recebido do cliente
          isCurrentLineBlank = false;
      }
    }
  }
}

String getHttpHeader() {
  String httpHeader = "{";
  httpHeader += "HTTP/1.1 200 OK\n";
  httpHeader += "Content-Type: Application/json\n";
  httpHeader += "Access-Control-Allow-Origin: *\n";
  httpHeader += "Connection: close\n";
  return httpHeader;
}

String getJSONValues() {
  String json = "{";
  json += "\"air_humidity\": \""+ (String)DHT11.humidity +"\",";
  json += "\"temperature\": \""+ (String)DHT11.temperature +"\",";
  json += "\"luminosity\": \""+ (String)analogRead(brightnessPin) +"\",";
  json += "\"soil_moisture\": \""+ (String)analogRead(soilMoisturePin) +"\",";
  json += "\"status_water_pump\": \""+ (String)digitalRead(waterPumpPin) +"\",";
  json += "\"status_lamp\": \""+ (String)digitalRead(lampPin) +"\",";
  json += "\"status_cooler\": \""+ (String)digitalRead(coolerPin) +"\",";
  json += "\"status_heating_lamp\": \""+ (String)digitalRead(heatingLampPin) +"\"";
  json += "}";
  return json;
}


void ControlLeds(String &request) {
  if (request.indexOf("lamp=1") > -1) {
    digitalWrite(lampPin, HIGH);
  } else if (request.indexOf("lamp=0") > -1) {
    digitalWrite(lampPin, LOW);
  }

  if (request.indexOf("waterPump=1") > -1) {
    digitalWrite(waterPumpPin, HIGH);
  } else if (request.indexOf("waterPump=0") > -1) {
    digitalWrite(waterPumpPin, LOW);
  }

  if (request.indexOf("cooler=1") > -1) {
    digitalWrite(coolerPin, HIGH);
  } else if (request.indexOf("cooler=0") > -1) {
    digitalWrite(coolerPin, LOW);
  }

  if (request.indexOf("heatingLamp=1") > -1) {
    digitalWrite(heatingLampPin, HIGH);
  } else if (request.indexOf("heatingLamp=0") > -1) {
    digitalWrite(heatingLampPin, LOW);
  }
}
