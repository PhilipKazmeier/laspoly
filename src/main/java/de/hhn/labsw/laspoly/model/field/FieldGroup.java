package de.hhn.labsw.laspoly.model.field;

import de.hhn.labsw.laspoly.model.Player;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * A  group is a fixed group of 1..4 streets that belong together.
 * A  group is located at one of the four board edges but never spans over
 * a corner.
 * Every gamescene in the group has the same colour. After a Player has bought every
 * street of a street group, he is allowed to build buildings ono of these streets.
 */
public class FieldGroup<T extends Field & Groupable> {
    private final List<T> groupedFields;

    /**
     * Creates a new group of groupable fields that belong together.
     * In the constructor every gamescene gets informed about this group
     * @param groupableFields list of groupable fields
     */
    @SafeVarargs
    public FieldGroup(final T... groupableFields) {
        this.groupedFields = Arrays.asList(groupableFields);
        for(Groupable groupable : groupableFields){
            /* if an IncompatibleClassChangeError occurs here, then the given object does not implement groupable (but it must)!! */
            groupable.setFieldGroup(this);
        }
    }

    /**
     * Checks weather a player owns all fields of the group.
     * @param player the player making the check with
     * @return true if the plaer owns all fields of this group; false otherwise
     */
    public boolean playerHasAllFields(Player player){
        final int[] counter = {0};
        player.getPropertyList().stream().forEach(e -> {
            if (groupedFields.contains(e.getProperty())) {
                counter[0]++;
            }
        });
        return counter[0] == groupedFields.size();
    }

    /**
     * @return a list of the fields that belong to this group.
     */
    public List<T> getGroupedFields() {
        return groupedFields;
    }

    /**
     * @return a list of indices of the fields which belong to this group.
     */
    public List<Integer> getFieldIndices() {
        List<Integer> indices = new ArrayList<>(groupedFields.size());
        indices.addAll(groupedFields.stream().map(Field::getPosition).collect(Collectors.toList()));
        return indices;
    }
}
