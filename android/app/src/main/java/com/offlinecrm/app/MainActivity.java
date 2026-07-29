package com.offlinecrm.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Explicitly switch theme from launch theme to main app theme
        // to clear any windowBackground drawable references from the Activity DecorView
        setTheme(R.style.AppTheme_NoActionBar);

        super.onCreate(savedInstanceState);

        /*
         * Enable edge-to-edge window decor fitting so Android passes
         * system status bar insets to CSS env(safe-area-inset-top).
         */
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        fixStatusBar();
    }

    /**
     * Make the status bar solid white with dark (visible) icons.
     * Works on API 23+ (Android 6+). Below that the status bar is always
     * dark-background, so no action is needed.
     */
    private void fixStatusBar() {
        Window window = getWindow();

        // Solid white background so content behind is never visible
        window.setStatusBarColor(Color.WHITE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // API 30+ — use WindowInsetsController
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.setSystemBarsAppearance(
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                );
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // API 23–29 — use legacy View flags
            View decorView = window.getDecorView();
            int flags = decorView.getSystemUiVisibility();
            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            decorView.setSystemUiVisibility(flags);
        }
    }
}
