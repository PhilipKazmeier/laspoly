/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Platform
 *  javafx.beans.property.IntegerProperty
 *  javafx.beans.property.ReadOnlyIntegerProperty
 *  javafx.beans.property.SimpleIntegerProperty
 *  javafx.beans.value.ObservableNumberValue
 *  javafx.beans.value.ObservableValue
 *  javafx.scene.control.Label
 *  javafx.scene.layout.Pane
 *  javafx.scene.layout.Region
 */
package de.hhn.seb.labsw.laspoly.view.game;

import de.hhn.seb.labsw.laspoly.model.message.IngameMessage;
import de.hhn.seb.labsw.laspoly.utils.ThreadRunner;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.NewNotificationDialog;
import java.util.stream.Stream;
import javafx.application.Platform;
import javafx.beans.property.IntegerProperty;
import javafx.beans.property.ReadOnlyIntegerProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.value.ObservableNumberValue;
import javafx.beans.value.ObservableValue;
import javafx.scene.control.Label;
import javafx.scene.layout.Pane;
import javafx.scene.layout.Region;

public class NotificationManager {
    private final Region gamePane;
    private final Region chatPane;
    private IntegerProperty unreadNotificationCount = new SimpleIntegerProperty(0);
    private Queue notQueue;
    private final double DIALOG_SPACING = 10.0;

    public ReadOnlyIntegerProperty getUnreadNotificationCount() {
        return this.unreadNotificationCount;
    }

    public IntegerProperty unreadNotificationCountProperty() {
        return this.unreadNotificationCount;
    }

    public NotificationManager(Label notificationCounter, Region gameScenePane, Region chatPanel) {
        this.gamePane = gameScenePane;
        this.chatPane = chatPanel;
        this.notQueue = new Queue();
        notificationCounter.visibleProperty().bind((ObservableValue)this.unreadNotificationCount.isNotEqualTo(0));
        notificationCounter.textProperty().bind((ObservableValue)this.unreadNotificationCount.asString());
        chatPanel.visibleProperty().addListener(e -> {
            if (chatPanel.isVisible()) {
                this.unreadNotificationCount.setValue((Number)0);
            }
        });
    }

    public void hideAllDialogs() {
        Stream.of(this.notQueue.dialogs).filter(dialog -> dialog != null).forEach(NewNotificationDialog::hide);
        this.notQueue.clear();
    }

    public void showNewNotification(IngameMessage message, Runnable onClickListener) {
        if (this.chatPane.isVisible()) {
            return;
        }
        Platform.runLater(() -> {
            this.unreadNotificationCount.setValue((Number)(this.unreadNotificationCount.getValue() + 1));
            NewNotificationDialog newDialog = new NewNotificationDialog((Pane)this.gamePane, message.getAction());
            newDialog.getLayout().setOnMouseClicked(e -> onClickListener.run());
            newDialog.getLayout().layoutYProperty().bind((ObservableValue)this.gamePane.heightProperty().subtract((ObservableNumberValue)newDialog.getLayout().heightProperty().add(10.0)));
            ThreadRunner.onFX(() -> this.showNewDialog(newDialog), 300L);
        });
    }

    private void showNewDialog(NewNotificationDialog newDialog) {
        newDialog.show();
        this.notQueue.push(newDialog);
        ThreadRunner.onFX(newDialog::hide, 13000L);
    }

    private class Queue {
        NewNotificationDialog[] dialogs = new NewNotificationDialog[3];
        double[] yTrans = new double[3];

        private Queue() {
            this.yTrans[0] = 0.0;
        }

        private void push(NewNotificationDialog newDialog) {
            if (this.dialogs[2] != null) {
                this.dialogs[2].move(this.yTrans[2] + 80.0);
                this.dialogs[2].hide();
            }
            this.dialogs[2] = this.dialogs[1];
            this.dialogs[1] = this.dialogs[0];
            this.dialogs[0] = newDialog;
            this.yTrans[1] = newDialog.getLayout().getHeight() + 10.0;
            if (this.dialogs[1] != null) {
                this.yTrans[2] = this.yTrans[1] + this.dialogs[1].getLayout().getHeight() + 10.0;
                this.dialogs[1].move(this.yTrans[1]);
            }
            if (this.dialogs[2] != null) {
                this.dialogs[2].move(this.yTrans[2]);
            }
        }

        private void clear() {
            this.dialogs[0] = null;
            this.dialogs[1] = null;
            this.dialogs[2] = null;
        }
    }
}

