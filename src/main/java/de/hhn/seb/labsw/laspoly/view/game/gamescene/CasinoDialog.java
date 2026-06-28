/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.animation.Interpolator
 *  javafx.animation.TranslateTransition
 *  javafx.scene.Node
 *  javafx.scene.control.Label
 *  javafx.scene.layout.Pane
 *  javafx.util.Duration
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene;

import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import java.util.ResourceBundle;
import javafx.animation.Interpolator;
import javafx.animation.TranslateTransition;
import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.layout.Pane;
import javafx.util.Duration;

public class CasinoDialog {
    private final Pane parentNode;
    private Pane layout;

    public CasinoDialog(ResourceBundle res, Pane parent) {
        this.parentNode = parent;
        String title = res.getString("casinoDialogTitle");
        String descr = res.getString("casinoDialogHeader");
        this.layout = (Pane)FXMLFile.CASINODIALOG.toLayout(this.getClass());
        Label titleLabel = (Label)this.layout.lookup("#titleLabel");
        titleLabel.setText(title);
        Label descriptLabel = (Label)this.layout.lookup("#descriptionLabel");
        descriptLabel.setText(descr);
        this.layout.setTranslateX(-this.layout.getPrefWidth());
        parent.getChildren().add(this.layout);
    }

    public Pane getLayout() {
        return this.layout;
    }

    public void setListener(Runnable listener) {
    }

    public void show() {
        TranslateTransition transition = new TranslateTransition(Duration.millis((double)1000.0), (Node)this.layout);
        transition.setInterpolator(Interpolator.EASE_OUT);
        transition.setToX(0.0);
        transition.play();
    }

    public void hide() {
        TranslateTransition mainTransition = new TranslateTransition(Duration.millis((double)500.0), (Node)this.layout);
        mainTransition.setInterpolator(Interpolator.EASE_IN);
        mainTransition.setToX(-this.layout.getPrefWidth());
        mainTransition.play();
        mainTransition.setOnFinished(e -> this.parentNode.getChildren().remove(this.layout));
    }
}

