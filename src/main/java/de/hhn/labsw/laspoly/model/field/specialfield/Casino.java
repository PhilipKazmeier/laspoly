package de.hhn.labsw.laspoly.model.field.specialfield;

import de.hhn.labsw.laspoly.model.Actor;

/**
 * At the beginning of a {@link de.hhn.labsw.laspoly.model.Game} there is a specific amount of money transferred to this
 * gamescene. If a {@link de.hhn.labsw.laspoly.model.Player} moves on this gamescene he gets a specific amount of money
 * depending on the dices the {@link de.hhn.labsw.laspoly.model.Player} rolled. The {@link
 * de.hhn.labsw.laspoly.model.Player} needs a double to get money. The higher the double the higher the money the {@link
 * de.hhn.labsw.laspoly.model.Player} gets.
 */
public class Casino extends SpecialField implements Actor {
    public static final int POSITION = 20;
    /**
     * Creates a Special Field and stores the position on the board.
     * The casino is located on the opposite side of the start field.
     */
    public Casino () {
        super(POSITION);
    }

    @Override
    public void transactMoney(Actor actor, int amount) {
        // TODO
    }

    @Override
    public void sendMessage(String message) {
        // TODO

    }

    @Override
    public int getMoneyAmount() {
        // TODO
        return 0;
    }
}
