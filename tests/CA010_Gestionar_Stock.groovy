import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def makeXPath(String xpath) {
    TestObject obj = new TestObject(xpath)
    obj.addProperty("xpath", ConditionType.EQUALS, xpath)
    return obj
}

def makeCSS(String css) {
    TestObject obj = new TestObject(css)
    obj.addProperty("css", ConditionType.EQUALS, css)
    return obj
}

// === PASO 1: Login como admin ===
WebUI.openBrowser('')
WebUI.navigateToUrl('https://try-on-web.vercel.app/login')
WebUI.delay(3)
WebUI.setText(makeCSS('input#email'), System.getenv('ADMIN_EMAIL') ?: 'test@example.com')
WebUI.setText(makeCSS('input#password'), System.getenv('ADMIN_PASSWORD') ?: 'password')
WebUI.click(makeXPath("//button[contains(text(), 'Iniciar')]"))
WebUI.delay(5)

// === PASO 2: Navegar a Inventario ===
WebUI.navigateToUrl('https://try-on-web.vercel.app/inventario')
WebUI.delay(5)
WebUI.takeScreenshot('CA010_paso1_inventario.png')

// === PASO 3: Click menú del primer producto ===
def menuBtn = makeXPath("(//table//tbody//tr[1]//button[last()])[1]")
WebUI.waitForElementVisible(menuBtn, 10)
WebUI.click(menuBtn)
WebUI.delay(2)
WebUI.takeScreenshot('CA010_paso2_menu.png')

// === PASO 4: Click "Gestionar stock" ===
def stockMenuItem = makeXPath("//div[@role='menuitem' and contains(text(), 'stock')]")
WebUI.waitForElementVisible(stockMenuItem, 5)
WebUI.click(stockMenuItem)
WebUI.delay(3)
WebUI.takeScreenshot('CA010_paso3_dialogo.png')

// === PASO 5: Solo cambiar Cantidad ===
def cantidadInput = makeXPath("//div[@role='dialog']//input[@type='number']")
WebUI.waitForElementVisible(cantidadInput, 10)
WebUI.clearText(cantidadInput)
WebUI.setText(cantidadInput, '25')

WebUI.takeScreenshot('CA010_paso4_editado.png')

// === PASO 6: Guardar ===
def guardarBtn = makeXPath("//div[@role='dialog']//button[contains(text(), 'Guardar')]")
WebUI.click(guardarBtn)
WebUI.delay(5)
WebUI.takeScreenshot('CA010_paso5_guardado.png')

WebUI.closeBrowser()
