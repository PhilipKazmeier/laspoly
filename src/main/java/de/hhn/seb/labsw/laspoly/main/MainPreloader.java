/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Preloader
 *  javafx.application.Preloader$PreloaderNotification
 *  javafx.application.Preloader$ProgressNotification
 *  javafx.application.Preloader$StateChangeNotification
 *  javafx.geometry.Pos
 *  javafx.scene.Node
 *  javafx.scene.Parent
 *  javafx.scene.Scene
 *  javafx.scene.control.Label
 *  javafx.scene.control.ProgressBar
 *  javafx.scene.effect.DropShadow
 *  javafx.scene.effect.Effect
 *  javafx.scene.image.Image
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.BorderPane
 *  javafx.scene.layout.Pane
 *  javafx.scene.layout.VBox
 *  javafx.stage.Stage
 *  javafx.stage.StageStyle
 */
package de.hhn.seb.labsw.laspoly.main;

import javafx.application.Preloader;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressBar;
import javafx.scene.effect.DropShadow;
import javafx.scene.effect.Effect;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.Pane;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import javafx.stage.StageStyle;

public class MainPreloader
extends Preloader {
    private static final int SPLASH_WIDTH = 350;
    private static final int SPLASH_HEIGHT = 367;
    private ProgressBar bar;
    private Stage stage;
    private Pane splashLayout;
    private Label progressText;
    private boolean noLoadingProgress = true;

    private Scene createPreloaderScene() {
        ImageView splash = new ImageView(new Image((this).getClass().getResourceAsStream("/de/hhn/seb/labsw/laspoly/view/LasPolyLogoFree.png")));
        splash.prefWidth(350.0);
        splash.prefHeight(367.0);
        this.bar = new ProgressBar(0.0);
        BorderPane p = new BorderPane();
        this.progressText = new Label("Loading Las Poly...");
        this.splashLayout = new VBox();
        this.splashLayout.getChildren().addAll(new Node[]{splash, this.bar, this.progressText});
        this.progressText.setAlignment(Pos.CENTER);
        this.splashLayout.setStyle("-fx-padding: 5; -fx-background-color: cornsilk; -fx-border-width: 5; -fx-background-color: linear-gradient(to bottom, cornflowerblue, derive(cornflowerblue, 50%));");
        this.splashLayout.setEffect((Effect)new DropShadow());
        p.setCenter((Node)this.splashLayout);
        return new Scene((Parent)p, 350.0, 367.0);
    }

    public void start(Stage preStage) throws Exception {
        this.stage = preStage;
        preStage.initStyle(StageStyle.UNDECORATED);
        preStage.setScene(this.createPreloaderScene());
        preStage.getIcons().add(new Image((this).getClass().getResourceAsStream("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png")));
        preStage.show();
    }

    public void handleProgressNotification(Preloader.ProgressNotification pn) {
        if (pn.getProgress() != 1.0 || !this.noLoadingProgress) {
            this.bar.setProgress(pn.getProgress() / 2.0);
            if (pn.getProgress() > 0.0) {
                this.noLoadingProgress = false;
            }
        }
    }

    public void handleApplicationNotification(Preloader.PreloaderNotification pn) {
        if (pn instanceof Preloader.ProgressNotification) {
            double v = ((Preloader.ProgressNotification)pn).getProgress();
            if (!this.noLoadingProgress) {
                v = 0.5 + v / 2.0;
            }
            this.bar.setProgress(v);
        } else if (pn instanceof Preloader.StateChangeNotification) {
            this.stage.hide();
        }
    }
}

