/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Preloader
 *  javafx.application.Preloader$ProgressNotification
 *  javafx.application.Preloader$StateChangeNotification
 *  javafx.application.Preloader$StateChangeNotification$Type
 *  javafx.scene.Node
 *  javafx.scene.Parent
 *  javafx.scene.Scene
 *  javafx.scene.control.ProgressBar
 *  javafx.scene.layout.BorderPane
 *  javafx.stage.Stage
 */
package de.hhn.seb.labsw.laspoly.main;

import javafx.application.Preloader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.ProgressBar;
import javafx.scene.layout.BorderPane;
import javafx.stage.Stage;

public class FancyPreloader
extends Preloader {
    private ProgressBar bar;
    private Stage stage;

    private Scene createPreloaderScene() {
        this.bar = new ProgressBar();
        BorderPane p = new BorderPane();
        p.setCenter((Node)this.bar);
        return new Scene((Parent)p, 300.0, 150.0);
    }

    public void start(Stage s) throws Exception {
        this.stage = s;
        s.setScene(this.createPreloaderScene());
        s.show();
    }

    public void handleProgressNotification(Preloader.ProgressNotification pn) {
        this.bar.setProgress(pn.getProgress());
    }

    public void handleStateChangeNotification(Preloader.StateChangeNotification evt) {
        if (evt.getType() == Preloader.StateChangeNotification.Type.BEFORE_START) {
            this.stage.hide();
        }
    }

    public void stop(Stage s) throws Exception {
        this.stage = s;
        s.hide();
    }
}

