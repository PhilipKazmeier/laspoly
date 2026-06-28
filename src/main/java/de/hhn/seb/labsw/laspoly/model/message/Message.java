/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.layout.Region
 *  javafx.scene.paint.Color
 */
package de.hhn.seb.labsw.laspoly.model.message;

import de.hhn.seb.labsw.laspoly.model.action.MessageAction;
import javafx.scene.layout.Region;
import javafx.scene.paint.Color;

public abstract class Message {
    private final MessageAction action;
    private Region pane;
    private double opacity;
    private Color color;

    protected Message(MessageAction messageAction, Color colorName) {
        this.action = messageAction;
        this.opacity = 1.0;
        this.color = colorName;
        this.create();
    }

    protected abstract void create();

    public Region draw() {
        return this.pane;
    }

    public MessageAction getAction() {
        return this.action;
    }

    protected void setPane(Region root) {
        this.pane = root;
    }

    public double getOpacity() {
        return this.opacity;
    }

    public void setOpacity(double op) {
        this.opacity = op;
        this.create();
    }

    protected Color getColor() {
        return this.color;
    }
}

