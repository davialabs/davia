export const MDX_SHADCN_INSTRUCTIONS = `<mdx_shadcn>
## Shadcn Component Instructions

### Best Practices
1. **Composition**: Combine multiple components to create rich interfaces
2. **Styling**: Use \`className\` prop for additional Tailwind CSS classes
3. **State Management**: Manage component state within custom components

### Forms
Use the following imports for forms and validation. Import shadcn form components from \`@/components/ui/form\`.

- **useForm** from react-hook-form - For form state management
- **zodResolver** from @hookform/resolvers/zod - For form validation
- **z** from zod - For schema validation

\`\`\`mdx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

export function ContactForm() {
  const formSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values) => {
    console.log(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
\`\`\`

### Charts
Recharts v2 components are available for data visualization. Import them from \`recharts\` as shown below.
**Important**: Remember to set a \`min-h-[VALUE]\` on the ChartContainer component. This is required for the chart to be responsive.
**Colors**: Use direct hex, hsl, or oklch values in chartConfig instead of CSS variables. Default chart colors available:
- **Chart 1**: \`oklch(0.646 0.222 41.116)\` (light) / \`oklch(0.488 0.243 264.376)\` (dark)
- **Chart 2**: \`oklch(0.6 0.118 184.704)\` (light) / \`oklch(0.696 0.17 162.48)\` (dark)
- **Chart 3**: \`oklch(0.398 0.07 227.392)\` (light) / \`oklch(0.769 0.188 70.08)\` (dark)
- **Chart 4**: \`oklch(0.828 0.189 84.429)\` (light) / \`oklch(0.627 0.265 303.9)\` (dark)
- **Chart 5**: \`oklch(0.769 0.188 70.08)\` (light) / \`oklch(0.645 0.246 16.439)\` (dark)

\`\`\`mdx
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";

export function SalesChart() {
  const chartData = [
    { month: "Jan", sales: 4000, profit: 2400 },
    { month: "Feb", sales: 3000, profit: 1398 },
    { month: "Mar", sales: 2000, profit: 9800 },
    { month: "Apr", sales: 2780, profit: 3908 },
    { month: "May", sales: 1890, profit: 4800 },
    { month: "Jun", sales: 2390, profit: 3800 },
  ];

  const chartConfig = {
    sales: {
      label: "Sales",
      color: "oklch(0.646 0.222 41.116)",
    },
    profit: {
      label: "Profit", 
      color: "oklch(0.6 0.118 184.704)",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="min-h-[150px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="sales" fill="var(--color-sales)" />
          <Bar dataKey="profit" fill="var(--color-profit)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
\`\`\`

### Toasts
Use Sonner by importing \`toast\`:

\`\`\`mdx
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SimpleToast() {
  const handleClick = () => {
    toast('Event has been created');
  };

  return (
    <Button onClick={handleClick}>Show Toast</Button>
  );
}
\`\`\`
</mdx_shadcn>`;
