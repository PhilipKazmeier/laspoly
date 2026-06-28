/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.action;

import de.hhn.seb.labsw.laspoly.model.card.action.ActionCard;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import java.util.Locale;

public abstract class SingleOptionActionCard
extends ActionCard {
    public SingleOptionActionCard(Locale loc, String identifier) {
        super(loc, identifier);
        this.getConfirm().setVisible(true);
    }

    protected abstract void onAction(Figure var1, GameHandler var2);

    @Override
    public String toString() {
        return this.getClass().getName() + "{}";
    }

    @Override
    public final void activate(Figure fig, GameHandler handler) {
        this.prepare(handler);
        handler.showActionCard(this);
        this.getConfirm().setOnAction(ev -> {
            handler.hideActionCard(this);
            this.onAction(fig, handler);
        });
    }
}

