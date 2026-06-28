/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.action.actioncards;

import de.hhn.seb.labsw.laspoly.exception.InvalidActionIdentifierException;
import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.card.action.actioncards.TransactionActionCard;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import java.util.Collection;
import java.util.Locale;
import java.util.Random;

public class BroadcastTransactionActionCard
extends TransactionActionCard {
    private int val = -1;

    public BroadcastTransactionActionCard(Locale loc, String identifier, boolean pos, int multiplierVal) throws InvalidActionIdentifierException {
        super(loc, identifier, pos, multiplierVal);
        if (!this.getBundle().getString(this.getIdentifier()).contains("%d")) {
            throw new InvalidActionIdentifierException("%d");
        }
    }

    @Override
    protected void prepare(GameHandler handler) {
        Random random = new Random();
        this.val = (random.nextInt(5) + 1) * this.getMultiplier();
        String text = String.format(this.getBundle().getString(this.getIdentifier()), this.val);
        this.getActionCardText().setText(text);
        this.setValues(this.val);
    }

    @Override
    protected void onAction(Figure fig, GameHandler handler) {
        if (this.isPositive()) {
            Collection<Player> players = handler.getPlayers().values();
            int[] temp = new int[]{0};
            players.stream().filter(p -> !p.getUser().equals(fig.getUser())).forEach(player -> {
                if (player.removeMoney(this.val)) {
                    temp[0] = temp[0] + this.val;
                    TransactionAction transaction = new TransactionAction(player.getUser(), this.val, false, fig.getUser());
                    handler.addAction(transaction);
                } else {
                    handler.kickPlayer(player.getUser(), "lostNoMoneyLeft");
                }
            });
            handler.getPlayer(fig.getUser()).addMoney(temp[0]);
            TransactionAction transaction = new TransactionAction(fig.getUser(), temp[0], true, fig.getUser());
            handler.addAction(transaction);
        } else {
            Collection<Player> players = handler.getPlayers().values();
            if (handler.getPlayer(fig.getUser()).removeMoney(this.val * (players.size() - 1))) {
                TransactionAction transaction = new TransactionAction(fig.getUser(), this.val * (players.size() - 1), false, fig.getUser());
                handler.addAction(transaction);
                players.forEach(player -> {
                    if (!player.getUser().equals(fig.getUser())) {
                        player.addMoney(this.val);
                        handler.addAction(new TransactionAction(player.getUser(), this.val, true, fig.getUser()));
                    }
                });
            } else {
                handler.kickPlayer(fig.getUser(), "lostNoMoneyLeft");
            }
        }
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "val=" + this.val + '}';
    }
}

