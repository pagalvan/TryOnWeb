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

// === PASO 2: Navegar a Categorías ===
WebUI.navigateToUrl('https://try-on-web.vercel.app/categorias')
WebUI.delay(5)
WebUI.takeScreenshot('CA011_paso1_categorias.png')

// === PASO 3: Click "Nueva Categoría" ===
def nuevaCatBtn = makeXPath("//button[contains(text(), 'Nueva Categor')]")
WebUI.waitForElementVisible(nuevaCatBtn, 10)
WebUI.click(nuevaCatBtn)
WebUI.delay(3)
WebUI.takeScreenshot('CA011_paso2_dialogo.png')

// === PASO 4: Llenar Nombre y Descripción (NO tocar estado) ===
def nombreInput = makeXPath("//div[@role='dialog']//input[@id='nombre']")
WebUI.waitForElementVisible(nombreInput, 10)
WebUI.setText(nombreInput, 'Categoria Test CA011')

def descInput = makeXPath("//div[@role='dialog']//textarea[@id='descripcion']")
WebUI.setText(descInput, 'Categoria de prueba para aceptacion')

// === PASO 5: Seleccionar Icono (el combobox que dice "Selecciona un icono") ===
def iconoTrigger = makeXPath("//div[@role='dialog']//button[@role='combobox' and .//span[contains(text(), 'icono')]]")
WebUI.click(iconoTrigger)
WebUI.delay(2)
def iconoOption = makeXPath("(//div[@role='listbox']//div[@role='option'])[1]")
WebUI.waitForElementVisible(iconoOption, 5)
WebUI.click(iconoOption)
WebUI.delay(1)

WebUI.takeScreenshot('CA011_paso3_formulario_lleno.png')

// === PASO 6: Click Crear ===
def crearBtn = makeXPath("//div[@role='dialog']//button[contains(text(), 'Crear')]")
WebUI.click(crearBtn)
WebUI.delay(5)
WebUI.takeScreenshot('CA011_paso4_categoria_creada.png')

WebUI.closeBrowser()
