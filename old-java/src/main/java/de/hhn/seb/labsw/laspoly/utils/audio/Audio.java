/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Application
 *  javafx.stage.Stage
 */
package de.hhn.seb.labsw.laspoly.utils.audio;

import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.audio.BackgroundMusic;
import java.util.logging.Logger;
import javafx.application.Application;
import javafx.stage.Stage;

public class Audio
extends Application {
    private final Logger logger = LoggerFactory.initializeLogger((this).getClass(), "de/hhn/seb/labsw/laspoly/util.audio/audio_logging.properties");

    public static void main(String[] args) {
        Audio.launch((String[])args);
    }

    public void start(Stage primaryStage) throws Exception {
        BackgroundMusic.initializeMusic();
        BackgroundMusic.initializeShort();
        BackgroundMusic.play("Cruisin");
        new Thread(() -> {
            for (int i = 1; i < 100; ++i) {
                try {
                    Thread.sleep(100L);
                    continue;
                }
                catch (InterruptedException e) {
                    this.logger.severe("Couldn't run the track");
                    e.printStackTrace();
                }
            }
            BackgroundMusic.setVolume(1.0);
            BackgroundMusic.shortPlay("Frank_Sinatra_-_This_Town");
        }).start();
        BackgroundMusic.setVolume(0.2);
    }
}

