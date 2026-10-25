package com.shrii.kairos;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Local plugins must be registered BEFORE super.onCreate
        registerPlugin(KairosSensorPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
