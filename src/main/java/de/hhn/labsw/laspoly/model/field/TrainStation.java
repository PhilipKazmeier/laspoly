package de.hhn.labsw.laspoly.model.field;
/**
 * This class represents a special {@link de.hhn.labsw.laspoly.model.field.Property} called Train Station from which it
 * is possible to travel. It only exists four times in a {@link de.hhn.labsw.laspoly.model.Game}. The rent will increase
 * with every {@link de.hhn.labsw.laspoly.model.field.TrainStation} a {@link de.hhn.labsw.laspoly.model.Player} owns. It
 * is possible to travel from a {@link de.hhn.labsw.laspoly.model.field.TrainStation} to an other {@link
 * de.hhn.labsw.laspoly.model.field.TrainStation} for a specific amount of money.
 */
public class TrainStation extends Property implements Groupable {
    /**
     * group with the other train stations
     */
    private FieldGroup group;

    /**
     * Constructor of {@link de.hhn.labsw.laspoly.model.field.Property}.
     *
     * @param pos  Position of this {@link de.hhn.labsw.laspoly.model.field.Field}.
     * @param name Name of this {@link de.hhn.labsw.laspoly.model.field.Property}.
     */
    public TrainStation (int pos, String name) {
        super(pos, name);
    }

    @Override
    public FieldGroup getFieldGroup() {
        return group;
    }

    @Override
    public void setFieldGroup(FieldGroup colourGroup) {
        this.group = colourGroup;
    }
}
