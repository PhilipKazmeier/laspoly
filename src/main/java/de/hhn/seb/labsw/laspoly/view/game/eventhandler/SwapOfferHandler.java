/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.event.ActionEvent
 *  javafx.event.EventHandler
 */
package de.hhn.seb.labsw.laspoly.view.game.eventhandler;

import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;

public class SwapOfferHandler
implements EventHandler<ActionEvent> {
    private final GameHandler handler;
    private final Property property;

    public SwapOfferHandler(GameHandler gameHandler, Property prop) {
        this.handler = gameHandler;
        this.property = prop;
    }

    public void handle(ActionEvent event) {
        this.handler.getScene().createSwapOffer(this.property);
        if (this.handler.getScene().showsListOfProps()) {
            this.handler.getScene().hideListOfProps();
        }
    }
}

