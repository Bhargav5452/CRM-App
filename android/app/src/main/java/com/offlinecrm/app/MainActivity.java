package com.offlinecrm.app;

import android.os.Bundle;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Explicitly switch theme from launch theme to main app theme
        setTheme(R.style.AppTheme_NoActionBar);

        super.onCreate(savedInstanceState);

        // Force light status bar appearance (dark icons & clock text)
        // regardless of OS system Dark Mode toggle
        Window window = getWindow();
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(true);
        }
    }
}
