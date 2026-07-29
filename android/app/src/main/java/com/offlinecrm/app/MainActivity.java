package com.offlinecrm.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Explicitly switch theme from launch theme to main app theme
        setTheme(R.style.AppTheme_NoActionBar);

        super.onCreate(savedInstanceState);
    }
}
