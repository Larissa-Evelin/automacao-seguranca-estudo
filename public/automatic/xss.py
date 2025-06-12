import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.alert import Alert
from selenium.webdriver.common.keys import Keys

# Criar pasta para armazenar evidências
evidencia_dir = 'logs_screenshots/evidencias_xss'
os.makedirs(evidencia_dir, exist_ok=True)

# Inicializar o navegador
driver = webdriver.Chrome()

# URL da página de login
url_login = 'http://localhost:3000/login.html'

# Lista de payloads XSS para testar
payloads = [
    '"><script>alert("XSS1")</script>',
    '"><img src=x onerror=alert("XSS2")>',
    '\'><svg/onload=alert("XSS3")>',
    '"><body onload=alert("XSS4")>',
]

try:
    for i, payload in enumerate(payloads):
        driver.get(url_login)
        time.sleep(1)  # Espera carregar a página

        # Localiza os elementos da página
        input_usuario = driver.find_element(By.ID, 'nome')
        input_senha = driver.find_element(By.ID, 'senha')
        btn_entrar = driver.find_element(By.XPATH, '//button[contains(text(),"Entrar")]')

        # Preenche o formulário
        input_usuario.clear()
        input_usuario.send_keys(payload)
        input_senha.clear()
        input_senha.send_keys('senhaqualquer')
        btn_entrar.click()

        time.sleep(2)  # Aguarda resposta

        # Trata o nome do arquivo para não conter caracteres inválidos
        nome_base = f"payload_{i}_" + payload.replace('"', '_').replace("'", "_").replace("<", "_").replace(">", "_").replace("/", "_")
        screenshot_path = os.path.join(evidencia_dir, nome_base + ".png")

        # Verifica se alerta aparece (vulnerável)
        try:
            alert = Alert(driver)
            alert_text = alert.text
            print(f"[VULNERÁVEL] Payload executado: {payload} - Alerta: {alert_text}")
            alert.accept()
            driver.save_screenshot(screenshot_path)
        except:
            print(f"[OK] Payload não executado: {payload}")
            driver.save_screenshot(screenshot_path)

        print(f"📸 Screenshot salva em: {screenshot_path}")
        time.sleep(2)  # Pausa entre os testes

finally:
    driver.quit()
