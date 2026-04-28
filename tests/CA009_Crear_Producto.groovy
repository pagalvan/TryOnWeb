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
WebUI.takeScreenshot('CA009_paso1_inventario.png')

// === PASO 3: Click "Nuevo Producto" ===
def nuevoBtn = makeXPath("//button[contains(text(), 'Nuevo Producto') or contains(text(), 'Nuevo producto')]")
WebUI.waitForElementVisible(nuevoBtn, 10)
WebUI.click(nuevoBtn)
WebUI.delay(3)
WebUI.takeScreenshot('CA009_paso2_dialogo.png')

// === PASO 4: Llenar TODOS los campos ===

// 4a. Nombre (input#nombre dentro del dialog)
def nombreInput = makeXPath("//div[@role='dialog']//input[@id='nombre']")
WebUI.waitForElementVisible(nombreInput, 10)
WebUI.setText(nombreInput, 'Producto Test CA009')

// 4b. SKU - click boton generar automatico (icono varita magica)
def skuAutoBtn = makeXPath("//div[@role='dialog']//input[@id='sku']/parent::div//button")
WebUI.click(skuAutoBtn)
WebUI.delay(1)

// 4c. Categoría - Select de Radix UI
def catTrigger = makeXPath("(//div[@role='dialog']//button[@role='combobox'])[1]")
WebUI.click(catTrigger)
WebUI.delay(1)
// Seleccionar la primera opción disponible
def catFirstOption = makeXPath("//div[@role='option'][1]")
WebUI.waitForElementVisible(catFirstOption, 5)
WebUI.click(catFirstOption)
WebUI.delay(1)

// 4d. Precio
def precioInput = makeXPath("//div[@role='dialog']//input[@type='number']")
WebUI.setText(precioInput, '50000')

// 4e. Descripción (textarea)
def descInput = makeXPath("//div[@role='dialog']//textarea")
WebUI.setText(descInput, 'Producto creado para prueba de aceptacion CA009')

// 4f. Estado - ya tiene valor por defecto "activo", lo dejamos

WebUI.takeScreenshot('CA009_paso3_formulario_lleno.png')

// === PASO 5: Click Crear ===
def crearBtn = makeXPath("//div[@role='dialog']//button[contains(text(), 'Crear')]")
WebUI.click(crearBtn)
WebUI.delay(5)
WebUI.takeScreenshot('CA009_paso4_producto_creado.png')

WebUI.closeBrowser()
