package de.hhn.labsw.laspoly.model.field.specialfield;

/**
 * If a {@link de.hhn.labsw.laspoly.model.Player} moves on this gamescene, he will be moved to the {@link
 * de.hhn.labsw.laspoly.model.field.specialfield.Prison}.
 */
public class GoToPrison extends SpecialField {
    public static final int POSITION = 30;

    /**
     * Constructor.
     *
     */
    public GoToPrison () {
        super(POSITION);
}
}
