/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.animation.FadeTransition
 *  javafx.animation.Interpolator
 *  javafx.animation.TranslateTransition
 *  javafx.beans.value.ObservableNumberValue
 *  javafx.beans.value.ObservableValue
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.scene.control.Label
 *  javafx.scene.layout.Pane
 *  javafx.util.Duration
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene;

import de.hhn.seb.labsw.laspoly.model.action.MessageAction;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import javafx.animation.FadeTransition;
import javafx.animation.Interpolator;
import javafx.animation.TranslateTransition;
import javafx.beans.value.ObservableNumberValue;
import javafx.beans.value.ObservableValue;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.layout.Pane;
import javafx.util.Duration;

public class NewNotificationDialog {
    private final Pane parentNode;
    private Pane layout;
    private TranslateTransition curMoveTrans;

    public NewNotificationDialog(Pane parent, MessageAction msg) {
        this.parentNode = parent;
        this.layout = (Pane)FXMLFile.NEW_MESSAGE_DIALOG.toLayout(this.getClass());
        Label titleLabel = (Label)this.layout.lookup("#name");
        titleLabel.setText(msg.getSender().getName());
        Label msgLabel = (Label)this.layout.lookup("#message");
        msgLabel.setText(msg.getMessage());
        this.layout.setTranslateX(this.parentNode.getWidth() + this.layout.getPrefWidth());
        parent.getChildren().add(this.layout);
        this.layout.setCursor(Cursor.HAND);
    }

    public Pane getLayout() {
        return this.layout;
    }

    public void setListener(Runnable listener) {
    }

    public void show() {
        TranslateTransition transition = new TranslateTransition(Duration.millis((double)1000.0), (Node)this.layout);
        transition.setInterpolator(Interpolator.EASE_OUT);
        transition.setToX(this.parentNode.getWidth() - this.layout.getPrefWidth());
        transition.setOnFinished(e -> this.layout.translateXProperty().bind((ObservableValue)this.parentNode.widthProperty().subtract((ObservableNumberValue)this.layout.widthProperty())));
        transition.play();
    }

    public void hide() {
        FadeTransition mainTransition = new FadeTransition(Duration.millis((double)800.0), (Node)this.layout);
        mainTransition.setToValue(0.0);
        mainTransition.play();
        mainTransition.setOnFinished(e -> this.parentNode.getChildren().remove(this.layout));
    }

    public void move(double toY) {
        if (this.curMoveTrans != null) {
            this.layout.setTranslateY(this.curMoveTrans.getToY());
            this.curMoveTrans.stop();
            this.curMoveTrans = null;
        }
        TranslateTransition trans = new TranslateTransition(Duration.millis((double)300.0), (Node)this.getLayout());
        trans.setToY(-toY);
        trans.setInterpolator(Interpolator.EASE_BOTH);
        trans.play();
        this.curMoveTrans = trans;
        trans.setOnFinished(e -> {
            this.curMoveTrans = null;
        });
    }
}

