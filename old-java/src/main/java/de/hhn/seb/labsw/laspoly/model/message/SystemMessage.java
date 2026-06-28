/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.control.Label
 *  javafx.scene.layout.AnchorPane
 *  javafx.scene.layout.Region
 *  javafx.scene.paint.Color
 */
package de.hhn.seb.labsw.laspoly.model.message;

import de.hhn.seb.labsw.laspoly.System;
import de.hhn.seb.labsw.laspoly.model.action.MessageAction;
import de.hhn.seb.labsw.laspoly.model.message.Message;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import javafx.scene.control.Label;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.Region;
import javafx.scene.paint.Color;
import org.joda.time.DateTime;

public class SystemMessage
extends Message {
    public SystemMessage(String message) {
        super(new MessageAction(System.SYSTEM_USER, message, System.SYSTEM_USER), Color.BLACK);
    }

    public SystemMessage(MessageAction messageAction) {
        super(messageAction, Color.BLACK);
    }

    @Override
    protected void create() {
        AnchorPane pane = (AnchorPane)FXMLFile.SYSTEM_MESSAGE.toLayout(this.getClass());
        pane.setOpacity(this.getOpacity());
        Label time = (Label)pane.lookup("#time");
        time.setOpacity(this.getOpacity());
        Label name = (Label)pane.lookup("#name");
        name.setOpacity(this.getOpacity());
        Label messageText = (Label)pane.lookup("#message");
        messageText.setOpacity(this.getOpacity());
        DateTime cal = this.getAction().getTime();
        int hour = cal.getHourOfDay();
        int minute = cal.getMinuteOfHour();
        time.setText(String.format("%02d", hour) + ":" + String.format("%02d", minute));
        time.setStyle("-fx-text-fill: silver");
        name.setText("System");
        messageText.setText(this.getAction().getMessage());
        this.setPane((Region)pane);
    }
}

