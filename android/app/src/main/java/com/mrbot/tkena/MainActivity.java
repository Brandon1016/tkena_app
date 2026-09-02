package com.mrbot.tkena;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Activa la inspección remota del WebView vía chrome://inspect,
        // incluso en builds de "release" (donde viene apagada por defecto).
        // TEMPORAL: quitar antes de publicar la app de verdad -- no es
        // buena práctica dejar esto activo en producción.
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
