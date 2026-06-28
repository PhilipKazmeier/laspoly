/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.animation.FadeTransition
 *  javafx.application.Preloader
 *  javafx.application.Preloader$ProgressNotification
 *  javafx.beans.value.ObservableValue
 *  javafx.geometry.Pos
 *  javafx.geometry.Rectangle2D
 *  javafx.scene.Node
 *  javafx.scene.Parent
 *  javafx.scene.Scene
 *  javafx.scene.control.Label
 *  javafx.scene.control.ProgressBar
 *  javafx.scene.effect.DropShadow
 *  javafx.scene.effect.Effect
 *  javafx.scene.image.Image
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.Pane
 *  javafx.scene.layout.VBox
 *  javafx.scene.web.WebView
 *  javafx.stage.Screen
 *  javafx.stage.Stage
 *  javafx.stage.StageStyle
 *  javafx.util.Duration
 */
package de.hhn.seb.labsw.laspoly.main;

import javafx.animation.FadeTransition;
import javafx.application.Preloader;
import javafx.beans.value.ObservableValue;
import javafx.geometry.Pos;
import javafx.geometry.Rectangle2D;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressBar;
import javafx.scene.effect.DropShadow;
import javafx.scene.effect.Effect;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.Pane;
import javafx.scene.layout.VBox;
import javafx.scene.web.WebView;
import javafx.stage.Screen;
import javafx.stage.Stage;
import javafx.stage.StageStyle;
import javafx.util.Duration;

public class FadePreloader
extends Preloader {
    private static final int SPLASH_WIDTH = 706;
    private static final int SPLASH_HEIGHT = 741;
    private ProgressBar bar;
    private Stage mainStage;
    private WebView webView;
    private Pane splashLayout;
    private Label progressText;

    public static void main(String[] args) throws Exception {
        FadePreloader.launch((String[])args);
    }

    public void init() {
        ImageView splash = new ImageView(new Image((this).getClass().getResourceAsStream("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png")));
        this.bar = new ProgressBar();
        this.bar.setPrefWidth(686.0);
        this.progressText = new Label("Loading Las Poly...");
        this.splashLayout = new VBox();
        this.splashLayout.getChildren().addAll(new Node[]{splash, this.bar, this.progressText});
        this.progressText.setAlignment(Pos.CENTER);
        this.splashLayout.setStyle("-fx-padding: 5; -fx-background-color: cornsilk; -fx-border-width: 5; -fx-background-color: linear-gradient(to bottom, chocolate, derive(chocolate, 50%));");
        this.splashLayout.setEffect((Effect)new DropShadow());
    }

    public void start(Stage initStage) throws Exception {
        this.showSplash(initStage);
        this.showMainStage();
        this.webView.getEngine().documentProperty().addListener((observableValue, document, document1) -> {
            if (initStage.isShowing()) {
                this.bar.progressProperty().unbind();
                this.bar.setProgress(1.0);
                this.progressText.setText("Las Poly is loaded");
                this.mainStage.setIconified(false);
                initStage.toFront();
                FadeTransition fadeSplash = new FadeTransition(Duration.seconds((double)1.2), (Node)this.splashLayout);
                fadeSplash.setFromValue(1.0);
                fadeSplash.setToValue(0.0);
                fadeSplash.setOnFinished(event -> initStage.hide());
                fadeSplash.play();
            }
        });
    }

    private void showMainStage() {
        this.mainStage.setOnCloseRequest(null);
        this.mainStage = new Stage(StageStyle.DECORATED);
        this.mainStage.setTitle("Las Poly");
        this.mainStage.setIconified(true);
        this.mainStage.getIcons().add(new Image((this).getClass().getResourceAsStream("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png")));
        this.webView = new WebView();
        this.webView.getEngine().load("http://hs-heilbronn.de/");
        this.bar.progressProperty().bind((ObservableValue)this.webView.getEngine().getLoadWorker().workDoneProperty().divide(100));
        Scene scene = new Scene((Parent)this.webView, 1000.0, 600.0);
        this.webView.prefWidthProperty().bind((ObservableValue)scene.widthProperty());
        this.webView.prefHeightProperty().bind((ObservableValue)scene.heightProperty());
        this.mainStage.setScene(scene);
        this.mainStage.show();
    }

    private void showSplash(Stage initStage) {
        Scene splashScene = new Scene((Parent)this.splashLayout);
        initStage.initStyle(StageStyle.UNDECORATED);
        Rectangle2D bounds = Screen.getPrimary().getBounds();
        initStage.setScene(splashScene);
        initStage.setX(bounds.getMinX() + bounds.getWidth() / 2.0 - 353.0);
        initStage.setY(bounds.getMinY() + bounds.getHeight() / 2.0 - 370.0);
        initStage.show();
    }

    public void handleProgressNotification(Preloader.ProgressNotification pn) {
        this.bar.setProgress(pn.getProgress());
    }
}

