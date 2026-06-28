package de.hhn.labsw.laspoly.model.field;
/**
 * This class represents a special {@link de.hhn.labsw.laspoly.model.field.Property} that exists only two times. The
 * rent that has to be paid on this {@link de.hhn.labsw.laspoly.model.field.Property} is higher the higher the eyes of
 * the dices are the {@link de.hhn.labsw.laspoly.model.Player} rolled. It's even higher if one {@link
 * de.hhn.labsw.laspoly.model.Player} owns both {@link de.hhn.labsw.laspoly.model.field.Attraction}.
 */
public class Attraction extends Property implements Groupable {
    /**
     * group with the other attraction(s)
     */
    private FieldGroup group;

    /**
     * Creates a new attraction at the specified index with the given name.
     *
     * @param pos  Position of this {@link de.hhn.labsw.laspoly.model.field.Field}
     * @param name Name of this {@link de.hhn.labsw.laspoly.model.field.Field}.
     */
    public Attraction(int pos, String name) {
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
