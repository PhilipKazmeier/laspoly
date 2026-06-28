/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.control.Label
 *  javafx.scene.layout.Region
 *  javafx.scene.layout.VBox
 *  javafx.scene.paint.Color
 */
package de.hhn.seb.labsw.laspoly.model.message;

import de.hhn.seb.labsw.laspoly.model.action.MessageAction;
import de.hhn.seb.labsw.laspoly.model.message.Message;
import de.hhn.seb.labsw.laspoly.model.message.MessageFilter;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import java.util.Arrays;
import java.util.List;
import javafx.scene.control.Label;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import org.joda.time.DateTime;

public class IngameMessage
extends Message {
    private final List<MessageFilter> types;

    public IngameMessage(MessageAction messageAction, MessageFilter ... messageFilterTypes) {
        super(messageAction, Color.rgb((int)235, (int)172, (int)79));
        this.types = Arrays.asList(messageFilterTypes);
    }

    public IngameMessage(MessageAction messageAction, Color color, MessageFilter ... messageFilterTypes) {
        super(messageAction, color);
        this.types = Arrays.asList(messageFilterTypes);
    }

    public boolean appliesToFilter(MessageFilter filter) {
        return this.types.contains(filter);
    }

    @Override
    protected void create() {
        VBox pane = (VBox)FXMLFile.INGAME_MESSAGE.toLayout(this.getClass());
        Label time = (Label)pane.lookup("#time");
        Label name = (Label)pane.lookup("#name");
        Label messageText = (Label)pane.lookup("#message");
        name.textFillProperty().set(this.getColor());
        DateTime cal = this.getAction().getTime();
        int hour = cal.getHourOfDay();
        int minute = cal.getMinuteOfHour();
        time.setText(String.format("%02d", hour) + ":" + String.format("%02d", minute));
        name.setText(this.getAction().getSender().getName());
        messageText.setText(this.getAction().getMessage());
        this.setPane((Region)pane);
    }
}

