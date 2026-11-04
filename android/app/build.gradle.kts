plugins {
    id("com.android.application")
}

// TWA: la app es la PWA de https://jeal1498.github.io/PWA-Clientela/ dentro de Chrome, sin barra de direcciones
// cuando el dominio está verificado (assetlinks.json). Los cambios de la web llegan solos; el APK casi no se toca.
android {
    namespace = "com.jeal1498.clientela"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.jeal1498.clientela"
        minSdk = 24
        targetSdk = 36
        // El workflow pasa el número de corrida; así cada APK sube de versión y se instala encima del anterior.
        val corrida = providers.environmentVariable("VERSION_CODE").orNull?.toIntOrNull() ?: 1
        versionCode = corrida
        versionName = "1.0.$corrida"
    }

    // La firma viene por variables de entorno (el workflow); nada de llaves ni contraseñas en el repo.
    val ruta = providers.environmentVariable("CLIENTELA_KEYSTORE_PATH").orNull
    val clave = providers.environmentVariable("CLIENTELA_FIRMA").orNull
    signingConfigs {
        if (!ruta.isNullOrBlank() && !clave.isNullOrBlank() && file(ruta).isFile) {
            create("clientela") {
                storeFile = file(ruta)
                storePassword = clave
                keyAlias = "clientela"
                keyPassword = clave
            }
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("clientela")
        }
    }
    // La revisión de lint no aporta en un TWA y descarga muchas dependencias.
    lint { checkReleaseBuilds = false; abortOnError = false }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.6.2")
}
